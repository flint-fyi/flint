import * as tsutils from "ts-api-utils";
import {
	IndexKind,
	SyntaxKind,
	TypeFlags,
	type BigIntLiteralType,
	type Declaration,
	type NumberLiteralType,
	type StringLiteralType,
	type Type,
} from "typescript";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
	type Checker,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { getConstrainedTypeAtLocation } from "./utils/getConstrainedType.ts";

type ComparisonKind =
	| SyntaxKind.EqualsEqualsEqualsToken
	| SyntaxKind.EqualsEqualsToken
	| SyntaxKind.ExclamationEqualsEqualsToken
	| SyntaxKind.ExclamationEqualsToken
	| SyntaxKind.GreaterThanEqualsToken
	| SyntaxKind.GreaterThanToken
	| SyntaxKind.LessThanEqualsToken
	| SyntaxKind.LessThanToken;
type KnownValue = bigint | boolean | null | number | string | undefined;
type Outcome =
	| "alwaysFalsy"
	| "alwaysNullish"
	| "alwaysTruthy"
	| "never"
	| "neverNullish";

const comparisonKinds = new Set<SyntaxKind>([
	SyntaxKind.EqualsEqualsEqualsToken,
	SyntaxKind.EqualsEqualsToken,
	SyntaxKind.ExclamationEqualsEqualsToken,
	SyntaxKind.ExclamationEqualsToken,
	SyntaxKind.GreaterThanEqualsToken,
	SyntaxKind.GreaterThanToken,
	SyntaxKind.LessThanEqualsToken,
	SyntaxKind.LessThanToken,
]);
const predicateMethods = new Set([
	"every",
	"filter",
	"find",
	"findIndex",
	"findLast",
	"findLastIndex",
	"some",
]);
const unknownValue = Symbol("unknown value");

function chainContainsPotentiallyAbsentAccess(
	node: AST.Expression,
	services: TypeScriptFileServices,
): boolean {
	const unwrapped = unwrapExpression(node);
	if (isChainAccessExpression(unwrapped)) {
		return (
			isPotentiallyAbsentAccess(unwrapped, services) ||
			chainContainsPotentiallyAbsentAccess(unwrapped.expression, services)
		);
	}
	return isPotentiallyAbsentAccess(unwrapped, services);
}

function compare(left: KnownValue, right: KnownValue, kind: ComparisonKind) {
	switch (kind) {
		case SyntaxKind.EqualsEqualsEqualsToken:
			return left === right;
		case SyntaxKind.EqualsEqualsToken:
			return looselyEqual(left, right);
		case SyntaxKind.ExclamationEqualsEqualsToken:
			return left !== right;
		case SyntaxKind.ExclamationEqualsToken:
			return !looselyEqual(left, right);
		case SyntaxKind.GreaterThanEqualsToken:
			return compareRelational(left, right) >= 0;
		case SyntaxKind.GreaterThanToken:
			return compareRelational(left, right) > 0;
		case SyntaxKind.LessThanEqualsToken:
			return compareRelational(left, right) <= 0;
		case SyntaxKind.LessThanToken:
			return compareRelational(left, right) < 0;
	}
}

function compareRelational(left: KnownValue, right: KnownValue) {
	if (typeof left === "string" && typeof right === "string") {
		return left === right ? 0 : left < right ? -1 : 1;
	}
	if (typeof left === "bigint" && typeof right === "bigint") {
		return left === right ? 0 : left < right ? -1 : 1;
	}
	const leftNumber = Number(left);
	const rightNumber = Number(right);
	return leftNumber === rightNumber ? 0 : leftNumber < rightNumber ? -1 : 1;
}

function getConstituents(type: Type) {
	return tsutils.unionConstituents(type);
}

function getIntrinsicName(type: Type) {
	return (type as { intrinsicName?: string }).intrinsicName;
}

function getKnownValue(type: Type): KnownValue | typeof unknownValue {
	if (tsutils.isTypeFlagSet(type, TypeFlags.Null)) {
		return null;
	}
	if (tsutils.isTypeFlagSet(type, TypeFlags.Undefined)) {
		return undefined;
	}
	if (tsutils.isTypeFlagSet(type, TypeFlags.BooleanLiteral)) {
		return getIntrinsicName(type) === "true";
	}
	if (tsutils.isTypeFlagSet(type, TypeFlags.StringLiteral)) {
		return (type as StringLiteralType).value;
	}
	if (tsutils.isTypeFlagSet(type, TypeFlags.NumberLiteral)) {
		return (type as NumberLiteralType).value;
	}
	if (tsutils.isTypeFlagSet(type, TypeFlags.BigIntLiteral)) {
		return BigInt((type as BigIntLiteralType).value.base10Value);
	}
	return unknownValue;
}

function getKnownValues(type: Type, implicitlyUndefined: boolean) {
	const values = getConstituents(type).map(getKnownValue);
	if (values.includes(unknownValue)) {
		return undefined;
	}
	if (implicitlyUndefined && !values.includes(undefined)) {
		values.push(undefined);
	}
	return values as KnownValue[];
}

function getNullishness(type: Type, implicitlyUndefined: boolean) {
	if (isIndeterminate(type)) {
		return undefined;
	}
	if (tsutils.isTypeFlagSet(type, TypeFlags.Never)) {
		return "never" as const;
	}
	const constituents = getConstituents(type);
	const possiblyNullish =
		implicitlyUndefined ||
		constituents.some((constituent) =>
			tsutils.isTypeFlagSet(
				constituent,
				TypeFlags.Null | TypeFlags.Undefined | TypeFlags.Void,
			),
		);
	const possiblyNonNullish = constituents.some(
		(constituent) =>
			!tsutils.isTypeFlagSet(
				constituent,
				TypeFlags.Null | TypeFlags.Undefined | TypeFlags.Void,
			),
	);
	if (
		!possiblyNonNullish &&
		constituents.every((constituent) =>
			tsutils.isTypeFlagSet(constituent, TypeFlags.Null | TypeFlags.Undefined),
		)
	) {
		return "alwaysNullish" as const;
	}
	if (!possiblyNullish) {
		return "neverNullish" as const;
	}
	return undefined;
}

function getOwnOptionalChainNullishness(
	node: AST.Expression,
	services: TypeScriptFileServices,
) {
	if (
		node.kind === SyntaxKind.PropertyAccessExpression &&
		node.questionDotToken
	) {
		const receiverType = services.typeChecker.getNonNullableType(
			services.typeChecker.getTypeAtLocation(node.expression),
		);
		const propertyType = services.typeChecker.getTypeOfPropertyOfType(
			receiverType,
			node.name.text,
		);
		return propertyType && getNullishness(propertyType, false);
	}
	if (node.kind === SyntaxKind.CallExpression && node.questionDotToken) {
		const returnTypes = tsutils
			.getCallSignaturesOfType(
				services.typeChecker.getNonNullableType(
					services.typeChecker.getTypeAtLocation(node.expression),
				),
			)
			.map((signature) => getNullishness(signature.getReturnType(), false));
		return returnTypes.length &&
			returnTypes.every((outcome) => outcome === "neverNullish")
			? "neverNullish"
			: undefined;
	}
	return undefined;
}

function getPredicateInfo(node: AST.CallExpression, typeChecker: Checker) {
	if (node.expression.kind === SyntaxKind.PropertyAccessExpression) {
		return {
			method: node.expression.name.text,
			receiver: node.expression.expression,
		};
	}
	if (node.expression.kind === SyntaxKind.ElementAccessExpression) {
		return {
			method: getStaticPropertyName(
				node.expression.argumentExpression,
				typeChecker,
			),
			receiver: node.expression.expression,
		};
	}
	return undefined;
}

function getPrimitiveDomains(type: Type): Set<string> | undefined {
	if (isIndeterminate(type)) {
		return undefined;
	}
	const domains = new Set<string>();
	for (const constituent of getConstituents(type)) {
		const parts = tsutils.intersectionConstituents(constituent);
		if (
			parts.some((part) => tsutils.isTypeFlagSet(part, TypeFlags.StringLike))
		) {
			domains.add("string");
		} else if (
			parts.some((part) => tsutils.isTypeFlagSet(part, TypeFlags.NumberLike))
		) {
			domains.add("number");
		} else if (
			parts.some((part) => tsutils.isTypeFlagSet(part, TypeFlags.BigIntLike))
		) {
			domains.add("bigint");
		} else if (
			parts.some((part) => tsutils.isTypeFlagSet(part, TypeFlags.BooleanLike))
		) {
			domains.add("boolean");
		} else if (tsutils.isTypeFlagSet(constituent, TypeFlags.Null)) {
			domains.add("null");
		} else if (
			tsutils.isTypeFlagSet(constituent, TypeFlags.Undefined | TypeFlags.Void)
		) {
			domains.add("undefined");
		} else {
			return undefined;
		}
	}
	return domains;
}

function getStaticPropertyName(node: AST.Expression, typeChecker: Checker) {
	const value = getKnownValue(getConstrainedTypeAtLocation(node, typeChecker));
	return typeof value === "string" || typeof value === "number"
		? String(value)
		: undefined;
}

function getTruthiness(
	type: Type,
	implicitlyUndefined: boolean,
): Outcome | undefined {
	if (isIndeterminate(type)) {
		return undefined;
	}
	if (tsutils.isTypeFlagSet(type, TypeFlags.Never)) {
		return "never";
	}
	const constituents = getConstituents(type);
	const possiblyFalsy =
		implicitlyUndefined ||
		constituents.some(
			(constituent) =>
				!isTruthyLiteral(constituent) &&
				tsutils.isTypeFlagSet(constituent, TypeFlags.PossiblyFalsy),
		);
	const possiblyTruthy = constituents.some((constituent) =>
		tsutils
			.intersectionConstituents(constituent)
			.every((part) => !tsutils.isFalsyType(part)),
	);
	if (!possiblyTruthy) {
		return "alwaysFalsy";
	}
	if (!possiblyFalsy) {
		return "alwaysTruthy";
	}
	return undefined;
}

function hasDisjointStrictDomains(left: Type, right: Type) {
	const leftDomains = getPrimitiveDomains(left);
	const rightDomains = getPrimitiveDomains(right);
	return !!(
		leftDomains &&
		rightDomains &&
		![...leftDomains].some((domain) => rightDomains.has(domain))
	);
}

function isChainAccessExpression(
	node: AST.Expression,
): node is
	| AST.CallExpression
	| AST.ElementAccessExpression
	| AST.PropertyAccessExpression {
	return (
		node.kind === SyntaxKind.CallExpression ||
		node.kind === SyntaxKind.ElementAccessExpression ||
		node.kind === SyntaxKind.PropertyAccessExpression
	);
}

function isIndeterminate(type: Type) {
	return getConstituents(type).some((constituent) =>
		tsutils.isTypeFlagSet(
			constituent,
			TypeFlags.Any | TypeFlags.TypeParameter | TypeFlags.Unknown,
		),
	);
}

function isPotentiallyAbsentAccess(
	node: AST.Expression,
	services: TypeScriptFileServices,
) {
	if (services.program.getCompilerOptions().noUncheckedIndexedAccess) {
		return false;
	}
	const unwrapped = unwrapExpression(node);
	if (
		unwrapped.kind !== SyntaxKind.ElementAccessExpression &&
		unwrapped.kind !== SyntaxKind.PropertyAccessExpression
	) {
		return false;
	}
	const receiverType = services.typeChecker.getTypeAtLocation(
		unwrapped.expression,
	);
	const propertyName =
		unwrapped.kind === SyntaxKind.PropertyAccessExpression
			? unwrapped.name.text
			: getStaticPropertyName(
					unwrapped.argumentExpression,
					services.typeChecker,
				);
	const resolvedSymbol =
		propertyName === undefined
			? undefined
			: services.typeChecker.getPropertyOfType(receiverType, propertyName);
	const symbol = resolvedSymbol?.declarations?.length
		? resolvedSymbol
		: undefined;
	const receivers = getConstituents(receiverType);
	if (unwrapped.kind === SyntaxKind.PropertyAccessExpression) {
		return (
			!symbol &&
			receivers.some((receiver) =>
				services.typeChecker.getIndexTypeOfType(receiver, IndexKind.String),
			)
		);
	}
	return receivers.some((receiver) => {
		if (symbol) {
			return false;
		}
		if (services.typeChecker.isTupleType(receiver)) {
			const index = getStaticPropertyName(
				unwrapped.argumentExpression,
				services.typeChecker,
			);
			return (
				index === undefined ||
				Number(index) >= services.typeChecker.getTypeArguments(receiver).length
			);
		}
		return true;
	});
}

function isTruthyLiteral(type: Type) {
	if (tsutils.isTypeFlagSet(type, TypeFlags.BooleanLiteral)) {
		return getIntrinsicName(type) === "true";
	}
	if (tsutils.isTypeFlagSet(type, TypeFlags.StringLiteral)) {
		return !!(type as StringLiteralType).value;
	}
	if (tsutils.isTypeFlagSet(type, TypeFlags.NumberLiteral)) {
		return !!(type as NumberLiteralType).value;
	}
	if (tsutils.isTypeFlagSet(type, TypeFlags.BigIntLiteral)) {
		return (type as BigIntLiteralType).value.base10Value !== "0";
	}
	return false;
}

function looselyEqual(left: KnownValue, right: KnownValue): boolean {
	if (left === null || left === undefined) {
		return right === null || right === undefined;
	}
	if (right === null || right === undefined) {
		return false;
	}
	if (typeof left === typeof right) {
		return left === right;
	}
	if (typeof left === "boolean") {
		return looselyEqual(Number(left), right);
	}
	if (typeof right === "boolean") {
		return looselyEqual(left, Number(right));
	}
	if (
		(typeof left === "string" && typeof right === "number") ||
		(typeof left === "number" && typeof right === "string")
	) {
		return Number(left) === Number(right);
	}
	if (
		(typeof left === "bigint" && typeof right === "string") ||
		(typeof left === "string" && typeof right === "bigint")
	) {
		try {
			return BigInt(left) === BigInt(right);
		} catch {
			return false;
		}
	}
	if (typeof left === "bigint" && typeof right === "number") {
		return Number.isInteger(right) && left === BigInt(right);
	}
	return (
		typeof left === "number" &&
		typeof right === "bigint" &&
		Number.isInteger(left) &&
		BigInt(left) === right
	);
}

function unwrapExpression(node: AST.Expression): AST.Expression {
	return node.kind === SyntaxKind.ParenthesizedExpression
		? unwrapExpression(node.expression)
		: node;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports conditions whose outcomes are statically known.",
		id: "unnecessaryConditions",
		presets: ["logical"],
	},
	messages: {
		alwaysFalsy: {
			primary: "This condition is always falsy.",
			secondary: [],
			suggestions: [],
		},
		alwaysFalsyPredicate: {
			primary: "This array predicate callback always returns a falsy value.",
			secondary: [],
			suggestions: [],
		},
		alwaysNullish: {
			primary: "This expression is always nullish.",
			secondary: [],
			suggestions: [],
		},
		alwaysTruthy: {
			primary: "This condition is always truthy.",
			secondary: [],
			suggestions: [],
		},
		alwaysTruthyPredicate: {
			primary: "This array predicate callback always returns a truthy value.",
			secondary: [],
			suggestions: [],
		},
		comparison: {
			primary: "This comparison is always {{ outcome }}.",
			secondary: [],
			suggestions: [],
		},
		impossibleCase: {
			primary: "This switch case can never match the switch expression.",
			secondary: [],
			suggestions: [],
		},
		never: {
			primary: "This expression has type `never`.",
			secondary: [],
			suggestions: [],
		},
		neverNullish: {
			primary: "This expression is never nullish.",
			secondary: [],
			suggestions: [],
		},
		requiresStrictNullChecks: {
			primary: "This rule requires the `strictNullChecks` compiler option.",
			secondary: [],
			suggestions: [],
		},
		unnecessaryOptionalChain: {
			primary:
				"This optional chain is unnecessary because the value is never nullish.",
			secondary: [],
			suggestions: ["Remove the unnecessary optional chain."],
		},
	},
	setup(context) {
		let enabled = true;

		function reportOutcome(
			node: AST.Expression,
			outcome: Outcome,
			services: TypeScriptFileServices,
		) {
			context.report({
				message: outcome,
				range: getTSNodeRange(node, services.sourceFile),
			});
		}

		function checkCondition(
			node: AST.Expression,
			services: TypeScriptFileServices,
			inverted = false,
			reportNode = node,
		): void {
			if (!enabled) {
				return;
			}
			const unwrapped = unwrapExpression(node);
			if (
				unwrapped.kind === SyntaxKind.PrefixUnaryExpression &&
				unwrapped.operator === SyntaxKind.ExclamationToken
			) {
				checkCondition(unwrapped.operand, services, !inverted, reportNode);
				return;
			}
			if (
				unwrapped.kind === SyntaxKind.BinaryExpression &&
				(unwrapped.operatorToken.kind === SyntaxKind.AmpersandAmpersandToken ||
					unwrapped.operatorToken.kind === SyntaxKind.BarBarToken)
			) {
				checkCondition(unwrapped.right, services);
				return;
			}
			const outcome = getTruthiness(
				getConstrainedTypeAtLocation(unwrapped, services.typeChecker),
				isPotentiallyAbsentAccess(unwrapped, services),
			);
			if (!outcome) {
				return;
			}
			const reportedOutcome =
				inverted && outcome !== "never"
					? outcome === "alwaysTruthy"
						? "alwaysFalsy"
						: "alwaysTruthy"
					: outcome;
			reportOutcome(reportNode, reportedOutcome, services);
		}

		function getComparisonOutcome(
			leftNode: AST.Expression,
			rightNode: AST.Expression,
			kind: ComparisonKind,
			services: TypeScriptFileServices,
		) {
			const leftType = getConstrainedTypeAtLocation(
				leftNode,
				services.typeChecker,
			);
			const rightType = getConstrainedTypeAtLocation(
				rightNode,
				services.typeChecker,
			);
			const leftValues = getKnownValues(
				leftType,
				isPotentiallyAbsentAccess(leftNode, services),
			);
			const rightValues = getKnownValues(
				rightType,
				isPotentiallyAbsentAccess(rightNode, services),
			);
			if (leftValues && rightValues) {
				const outcomes = leftValues.flatMap((left) =>
					rightValues.map((right) => compare(left, right, kind)),
				);
				if (outcomes.every(Boolean)) {
					return true;
				}
				if (outcomes.every((outcome) => !outcome)) {
					return false;
				}
				return undefined;
			}
			if (
				(kind === SyntaxKind.EqualsEqualsEqualsToken ||
					kind === SyntaxKind.ExclamationEqualsEqualsToken) &&
				hasDisjointStrictDomains(leftType, rightType)
			) {
				return kind === SyntaxKind.ExclamationEqualsEqualsToken;
			}
			return undefined;
		}

		function checkComparison(
			node: AST.BinaryExpression,
			services: TypeScriptFileServices,
		) {
			if (!enabled || !comparisonKinds.has(node.operatorToken.kind)) {
				return;
			}
			const outcome = getComparisonOutcome(
				node.left,
				node.right,
				node.operatorToken.kind as ComparisonKind,
				services,
			);
			if (outcome === undefined) {
				return;
			}
			context.report({
				data: { outcome: String(outcome) },
				message: "comparison",
				range: getTSNodeRange(node, services.sourceFile),
			});
		}

		function checkOptional(
			node:
				| AST.CallExpression
				| AST.ElementAccessExpression
				| AST.PropertyAccessExpression,
			services: TypeScriptFileServices,
		) {
			if (!enabled || !node.questionDotToken) {
				return;
			}
			const expression = unwrapExpression(node.expression);
			if (
				chainContainsPotentiallyAbsentAccess(expression, services) ||
				(getOwnOptionalChainNullishness(expression, services) ??
					getNullishness(
						getConstrainedTypeAtLocation(expression, services.typeChecker),
						false,
					)) !== "neverNullish"
			) {
				return;
			}
			const range = getTSNodeRange(node.questionDotToken, services.sourceFile);
			context.report({
				message: "unnecessaryOptionalChain",
				range,
				suggestions: [
					{
						id: "removeOptionalChain",
						range,
						text: node.kind === SyntaxKind.PropertyAccessExpression ? "." : "",
					},
				],
			});
		}

		function reportPredicate(
			node: AST.Expression,
			outcome: Outcome | undefined,
			services: TypeScriptFileServices,
		) {
			if (outcome !== "alwaysFalsy" && outcome !== "alwaysTruthy") {
				return;
			}
			context.report({
				message:
					outcome === "alwaysTruthy"
						? "alwaysTruthyPredicate"
						: "alwaysFalsyPredicate",
				range: getTSNodeRange(node, services.sourceFile),
			});
		}

		function checkPredicate(
			node: AST.CallExpression,
			services: TypeScriptFileServices,
		) {
			if (!enabled) {
				return;
			}
			const predicate = getPredicateInfo(node, services.typeChecker);
			const method = predicate?.method;
			if (!method || !predicateMethods.has(method)) {
				return;
			}
			const receiverTypes = getConstituents(
				services.typeChecker.getTypeAtLocation(predicate.receiver),
			);
			if (
				!receiverTypes.every(
					(type) =>
						services.typeChecker.isArrayType(type) ||
						services.typeChecker.isTupleType(type),
				)
			) {
				return;
			}
			if (
				!receiverTypes.every((type) => {
					const methodSymbol = services.typeChecker.getPropertyOfType(
						type,
						method,
					) as { getDeclarations(): Declaration[] };
					return methodSymbol
						.getDeclarations()
						.every((declaration) =>
							services.program.isSourceFileDefaultLibrary(
								declaration.getSourceFile(),
							),
						);
				})
			) {
				return;
			}
			const callback = node.arguments[0];
			if (!callback) {
				return;
			}
			if (
				callback.kind === SyntaxKind.ArrowFunction ||
				callback.kind === SyntaxKind.FunctionExpression
			) {
				const expressionBody =
					callback.body.kind !== SyntaxKind.Block
						? callback.body
						: callback.body.statements.length === 1 &&
							  callback.body.statements[0]?.kind === SyntaxKind.ReturnStatement
							? callback.body.statements[0].expression
							: undefined;
				if (expressionBody) {
					reportPredicate(
						expressionBody,
						getTruthiness(
							getConstrainedTypeAtLocation(
								expressionBody,
								services.typeChecker,
							),
							false,
						),
						services,
					);
					return;
				}
			}
			let possiblyFalsy = false;
			let possiblyTruthy = false;
			for (const signature of tsutils.getCallSignaturesOfType(
				getConstrainedTypeAtLocation(callback, services.typeChecker),
			)) {
				const returnType =
					services.typeChecker.getBaseConstraintOfType(
						signature.getReturnType(),
					) ?? signature.getReturnType();
				if (isIndeterminate(returnType)) {
					return;
				}
				const outcome = getTruthiness(returnType, false);
				if (outcome === "never") {
					continue;
				}
				possiblyFalsy ||= outcome !== "alwaysTruthy";
				possiblyTruthy ||= outcome !== "alwaysFalsy";
				if (possiblyFalsy && possiblyTruthy) {
					return;
				}
			}
			reportPredicate(
				callback,
				possiblyTruthy
					? "alwaysTruthy"
					: possiblyFalsy
						? "alwaysFalsy"
						: undefined,
				services,
			);
		}

		return {
			visitors: {
				BinaryExpression: (node, services) => {
					checkComparison(node, services);
					const kind = node.operatorToken.kind;
					if (
						kind === SyntaxKind.QuestionQuestionToken ||
						kind === SyntaxKind.QuestionQuestionEqualsToken
					) {
						if (!enabled) {
							return;
						}
						const outcome = getNullishness(
							getConstrainedTypeAtLocation(node.left, services.typeChecker),
							isPotentiallyAbsentAccess(node.left, services),
						);
						if (outcome) {
							reportOutcome(node.left, outcome, services);
						}
					} else if (
						kind === SyntaxKind.AmpersandAmpersandToken ||
						kind === SyntaxKind.BarBarToken ||
						kind === SyntaxKind.AmpersandAmpersandEqualsToken ||
						kind === SyntaxKind.BarBarEqualsToken
					) {
						checkCondition(node.left, services);
					}
				},
				CallExpression: (node, services) => {
					checkOptional(node, services);
					checkPredicate(node, services);
				},
				CaseClause: (node, services) => {
					if (!enabled) {
						return;
					}
					const outcome = getComparisonOutcome(
						node.parent.parent.expression,
						node.expression,
						SyntaxKind.EqualsEqualsEqualsToken,
						services,
					);
					if (outcome === false) {
						context.report({
							message: "impossibleCase",
							range: getTSNodeRange(node.expression, services.sourceFile),
						});
					}
				},
				ConditionalExpression: (node, services) => {
					checkCondition(node.condition, services);
				},
				DoStatement: (node, services) => {
					checkCondition(node.expression, services);
				},
				ElementAccessExpression: checkOptional,
				ForStatement: (node, services) => {
					if (node.condition) {
						checkCondition(node.condition, services);
					}
				},
				IfStatement: (node, services) => {
					checkCondition(node.expression, services);
				},
				PropertyAccessExpression: checkOptional,
				SourceFile: (node, services) => {
					enabled = tsutils.isStrictCompilerOptionEnabled(
						services.program.getCompilerOptions(),
						"strictNullChecks",
					);
					if (!enabled) {
						context.report({
							message: "requiresStrictNullChecks",
							range: {
								begin: node.getStart(services.sourceFile),
								end: node.getStart(services.sourceFile),
							},
						});
					}
				},
				WhileStatement: (node, services) => {
					checkCondition(node.expression, services);
				},
			},
		};
	},
});
