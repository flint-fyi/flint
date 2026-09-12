import * as tsutils from "ts-api-utils";
import ts, { SyntaxKind } from "typescript";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
	type Checker,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { getConstrainedTypeAtLocation } from "./utils/getConstrainedType.ts";

type Assertion = AST.AsExpression | AST.TypeAssertion;

function areSafelyEquivalent(
	originalType: ts.Type,
	assertedType: ts.Type,
	typeChecker: Checker,
) {
	if (
		tsutils.isTypeFlagSet(originalType, ts.TypeFlags.Unknown) ||
		tsutils.isTypeFlagSet(assertedType, ts.TypeFlags.Unknown) ||
		typeContainsAny(originalType, typeChecker) ||
		typeContainsAny(assertedType, typeChecker)
	) {
		return false;
	}

	if (originalType === assertedType) {
		return true;
	}

	if (
		typeContainsRisk(originalType, typeChecker) ||
		typeContainsRisk(assertedType, typeChecker)
	) {
		return false;
	}

	const originalTypeArguments = getTypeArguments(originalType, typeChecker);
	const assertedTypeArguments = getTypeArguments(assertedType, typeChecker);
	return (
		!originalType.getCallSignatures().length &&
		!assertedType.getCallSignatures().length &&
		!originalType.getConstructSignatures().length &&
		!assertedType.getConstructSignatures().length &&
		originalTypeArguments.length === assertedTypeArguments.length &&
		originalTypeArguments.every(
			(typeArgument, index) => typeArgument === assertedTypeArguments[index],
		) &&
		haveSameProperties(originalType, assertedType, typeChecker) &&
		haveSameIndexSignatures(originalType, assertedType, typeChecker) &&
		typeChecker.isTypeAssignableTo(originalType, assertedType) &&
		typeChecker.isTypeAssignableTo(assertedType, originalType)
	);
}

function containsComment(text: string) {
	return text.includes("/*") || text.includes("//");
}

function getAssertionExpression(node: Assertion) {
	let expression = node.expression;
	while (
		expression.kind === SyntaxKind.AsExpression ||
		expression.kind === SyntaxKind.TypeAssertionExpression ||
		expression.kind === SyntaxKind.ParenthesizedExpression
	) {
		expression = expression.expression;
	}
	return expression;
}

function getAssertionFix(
	node: Assertion,
	expression: AST.Expression,
	sourceFile: AST.SourceFile,
) {
	const range = getTSNodeRange(node, sourceFile);
	const expressionRange = getTSNodeRange(expression, sourceFile);
	const removedText = sourceFile.text.slice(
		node.kind === SyntaxKind.AsExpression ? expressionRange.end : range.begin,
		node.kind === SyntaxKind.AsExpression ? range.end : expressionRange.begin,
	);
	if (containsComment(removedText)) {
		return undefined;
	}

	return {
		range,
		text: sourceFile.text.slice(expressionRange.begin, expressionRange.end),
	};
}

function getTypeArguments(type: ts.Type, typeChecker: Checker) {
	return tsutils.isTypeReference(type)
		? typeChecker.getTypeArguments(type)
		: (type.aliasTypeArguments ?? []);
}

function hasOuterAssertion(node: Assertion) {
	let parent = node.parent as ts.Node;
	while (parent.kind === SyntaxKind.ParenthesizedExpression) {
		parent = parent.parent;
	}
	return (
		parent.kind === SyntaxKind.AsExpression ||
		parent.kind === SyntaxKind.TypeAssertionExpression
	);
}

function haveSameIndexSignatures(
	originalType: ts.Type,
	assertedType: ts.Type,
	typeChecker: Checker,
) {
	const originalIndexes = typeChecker.getIndexInfosOfType(originalType);
	const assertedIndexes = typeChecker.getIndexInfosOfType(assertedType);
	return (
		originalIndexes.length === assertedIndexes.length &&
		originalIndexes.every((originalIndex) =>
			assertedIndexes.some(
				(assertedIndex) =>
					originalIndex.isReadonly === assertedIndex.isReadonly &&
					originalIndex.keyType === assertedIndex.keyType &&
					originalIndex.type === assertedIndex.type,
			),
		)
	);
}

function haveSameProperties(
	originalType: ts.Type,
	assertedType: ts.Type,
	typeChecker: Checker,
) {
	const originalProperties = originalType.getProperties();
	const assertedProperties = assertedType.getProperties();
	return (
		originalProperties.length === assertedProperties.length &&
		originalProperties.every((originalProperty) => {
			const assertedProperty = assertedType.getProperty(originalProperty.name);
			return (
				assertedProperty !== undefined &&
				typeChecker.getTypeOfSymbol(originalProperty) ===
					typeChecker.getTypeOfSymbol(assertedProperty) &&
				tsutils.isPropertyReadonlyInType(
					originalType,
					originalProperty.escapedName,
					typeChecker,
				) ===
					tsutils.isPropertyReadonlyInType(
						assertedType,
						assertedProperty.escapedName,
						typeChecker,
					)
			);
		})
	);
}

function isConstAssertion(node: Assertion) {
	return (
		node.type.kind === SyntaxKind.TypeReference &&
		node.type.typeName.kind === SyntaxKind.Identifier &&
		node.type.typeName.text === "const"
	);
}

function isDeclareVariable(declaration: ts.VariableDeclaration) {
	const statement = declaration.parent.parent;
	return (
		ts.isVariableStatement(statement) &&
		tsutils.includesModifier(statement.modifiers, SyntaxKind.DeclareKeyword)
	);
}

function isGenericCallLikeExpression(
	expression: AST.Expression,
	typeChecker: Checker,
) {
	while (expression.kind === SyntaxKind.AwaitExpression) {
		expression = expression.expression;
	}

	if (
		expression.kind !== SyntaxKind.CallExpression &&
		expression.kind !== SyntaxKind.NewExpression &&
		expression.kind !== SyntaxKind.TaggedTemplateExpression
	) {
		return false;
	}

	if (expression.typeArguments?.length) {
		return false;
	}

	const expressionType = typeChecker.getTypeAtLocation(
		expression.kind === SyntaxKind.TaggedTemplateExpression
			? expression.tag
			: expression.expression,
	);
	return [
		...expressionType.getCallSignatures(),
		...expressionType.getConstructSignatures(),
	].some((signature) => signature.typeParameters?.length);
}

function isImplicitlyNarrowedLiteral(node: Assertion) {
	const parent = node.parent;
	if (parent.kind === SyntaxKind.VariableDeclaration) {
		return (
			parent.initializer === node && parent.parent.flags & ts.NodeFlags.Const
		);
	}

	if (
		parent.kind !== SyntaxKind.PropertyDeclaration ||
		parent.initializer !== node
	) {
		return false;
	}

	return parent.modifiers?.some(
		(modifier) => modifier.kind === SyntaxKind.ReadonlyKeyword,
	);
}

function isLiteralExpression(expression: AST.Expression) {
	return (
		expression.kind === SyntaxKind.BigIntLiteral ||
		expression.kind === SyntaxKind.FalseKeyword ||
		expression.kind === SyntaxKind.NoSubstitutionTemplateLiteral ||
		expression.kind === SyntaxKind.NumericLiteral ||
		expression.kind === SyntaxKind.StringLiteral ||
		expression.kind === SyntaxKind.TrueKeyword
	);
}

function isPossiblyNullish(type: ts.Type): boolean {
	if (tsutils.isTypeFlagSet(type, ts.TypeFlags.TypeParameter)) {
		const constraint = type.getConstraint();
		return constraint === undefined || isPossiblyNullish(constraint);
	}

	return tsutils
		.unionConstituents(type)
		.some((constituent) =>
			tsutils.isTypeFlagSet(
				constituent,
				ts.TypeFlags.Any |
					ts.TypeFlags.Null |
					ts.TypeFlags.Undefined |
					ts.TypeFlags.Unknown |
					ts.TypeFlags.Void,
			),
		);
}

function isPossiblyUnassignedIdentifier(
	node: AST.Expression,
	typeChecker: Checker,
) {
	if (node.kind !== SyntaxKind.Identifier) {
		return false;
	}

	const declaration = typeChecker.getSymbolAtLocation(node)?.valueDeclaration;
	return (
		declaration !== undefined &&
		ts.isVariableDeclaration(declaration) &&
		declaration.initializer === undefined &&
		declaration.exclamationToken === undefined &&
		!isDeclareVariable(declaration)
	);
}

function isSafeCallArgument(
	node: Assertion | AST.NonNullExpression,
	typeChecker: Checker,
) {
	const parent = node.parent;
	if (
		parent.kind !== SyntaxKind.CallExpression &&
		parent.kind !== SyntaxKind.NewExpression
	) {
		return true;
	}

	const signatures = [
		...typeChecker.getTypeAtLocation(parent.expression).getCallSignatures(),
		...typeChecker
			.getTypeAtLocation(parent.expression)
			.getConstructSignatures(),
	];
	return (
		signatures.length === 1 &&
		(parent.typeArguments?.length || !signatures[0]?.typeParameters?.length)
	);
}

function isSafeContextualLocation(node: Assertion | AST.NonNullExpression) {
	const parent = node.parent;
	if (
		parent.kind === SyntaxKind.CallExpression ||
		parent.kind === SyntaxKind.NewExpression
	) {
		return parent.arguments?.includes(node) === true;
	}

	return (
		(parent.kind === SyntaxKind.VariableDeclaration ||
			parent.kind === SyntaxKind.PropertyDeclaration) &&
		parent.initializer === node &&
		parent.type !== undefined
	);
}

function isUnsafeAssertionContext(node: Assertion, typeChecker: Checker) {
	const expression = getAssertionExpression(node);
	if (isGenericCallLikeExpression(expression, typeChecker)) {
		return true;
	}

	return (
		expression.kind === SyntaxKind.ArrayLiteralExpression ||
		expression.kind === SyntaxKind.ArrowFunction ||
		expression.kind === SyntaxKind.ClassExpression ||
		expression.kind === SyntaxKind.FunctionExpression ||
		expression.kind === SyntaxKind.JsxElement ||
		expression.kind === SyntaxKind.JsxSelfClosingElement ||
		expression.kind === SyntaxKind.TemplateExpression
	);
}

function isUnsafeParentContext(node: Assertion, program: ts.Program) {
	let expression = node as ts.Expression;
	let parent = node.parent as ts.Node;
	while (ts.isParenthesizedExpression(parent)) {
		expression = parent;
		parent = parent.parent;
	}

	if (
		parent.kind === SyntaxKind.SatisfiesExpression ||
		parent.kind === SyntaxKind.SpreadElement
	) {
		return true;
	}

	if (
		program.getCompilerOptions().noUncheckedIndexedAccess &&
		ts.isElementAccessExpression(parent) &&
		parent.argumentExpression === expression
	) {
		return true;
	}

	if (
		(ts.isElementAccessExpression(parent) ||
			ts.isPropertyAccessExpression(parent)) &&
		parent.expression === expression &&
		tsutils.getAccessKind(parent) & tsutils.AccessKind.Write
	) {
		return true;
	}

	if (
		ts.isVariableDeclaration(parent) &&
		parent.initializer === expression &&
		tsutils.isDestructuringPattern(parent.name)
	) {
		return true;
	}

	return (
		ts.isBinaryExpression(parent) &&
		parent.right === expression &&
		tsutils.isAssignmentKind(parent.operatorToken.kind)
	);
}

function typeContainsAny(
	type: ts.Type,
	typeChecker: Checker,
	seenTypes = new Set<ts.Type>(),
): boolean {
	if (tsutils.isTypeFlagSet(type, ts.TypeFlags.Any)) {
		return true;
	}

	if (seenTypes.has(type)) {
		return false;
	}

	seenTypes.add(type);
	return [
		...tsutils.typeConstituents(type),
		...getTypeArguments(type, typeChecker),
		...type
			.getProperties()
			.map((property) => typeChecker.getTypeOfSymbol(property)),
	].some(
		(nestedType) =>
			nestedType !== type &&
			typeContainsAny(nestedType, typeChecker, seenTypes),
	);
}

function typeContainsRisk(
	type: ts.Type,
	typeChecker: Checker,
	activeTypes = new Set<ts.Type>(),
	completedTypes = new Map<ts.Type, boolean>(),
): boolean {
	const completed = completedTypes.get(type);
	if (completed !== undefined) {
		return completed;
	}

	if (activeTypes.has(type)) {
		return true;
	}

	if (
		tsutils.isTypeFlagSet(
			type,
			ts.TypeFlags.Any | ts.TypeFlags.Index | ts.TypeFlags.TypeVariable,
		)
	) {
		return true;
	}

	activeTypes.add(type);
	const nestedTypes = [
		...tsutils.typeConstituents(type),
		...getTypeArguments(type, typeChecker),
		...type
			.getProperties()
			.map((property) => typeChecker.getTypeOfSymbol(property)),
		...typeChecker
			.getIndexInfosOfType(type)
			.flatMap((info) => [info.keyType, info.type]),
	];
	const result = nestedTypes.some(
		(nestedType) =>
			nestedType !== type &&
			typeContainsRisk(nestedType, typeChecker, activeTypes, completedTypes),
	);
	activeTypes.delete(type);
	completedTypes.set(type, result);
	return result;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports type assertions that do not change an expression's type or are unnecessary in context.",
		id: "unnecessaryTypeAssertions",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		alreadyAccepted: {
			primary: "The expression's original type is already accepted here.",
			secondary: [
				"The surrounding context accepts the unasserted expression, so the assertion does not provide additional type safety.",
			],
			suggestions: ["Remove the unnecessary type assertion."],
		},
		unchangedType: {
			primary: "This assertion does not change the expression's type.",
			secondary: [
				"An assertion is unnecessary when the expression already has the asserted type or is already known to be non-null.",
			],
			suggestions: ["Remove the unnecessary type assertion."],
		},
	},
	setup(context) {
		function checkAssertion(
			node: Assertion,
			{ program, sourceFile, typeChecker }: TypeScriptFileServices,
		) {
			if (
				isConstAssertion(node) ||
				hasOuterAssertion(node) ||
				isUnsafeAssertionContext(node, typeChecker) ||
				isUnsafeParentContext(node, program) ||
				!isSafeCallArgument(node, typeChecker)
			) {
				return;
			}

			const expression = getAssertionExpression(node);
			const originalType = typeChecker.getTypeAtLocation(expression);
			const assertedType = typeChecker.getTypeAtLocation(node);
			let message: "alreadyAccepted" | "unchangedType" | undefined;

			if (
				(!isLiteralExpression(expression) ||
					isImplicitlyNarrowedLiteral(node)) &&
				expression.kind !== SyntaxKind.ObjectLiteralExpression &&
				areSafelyEquivalent(originalType, assertedType, typeChecker)
			) {
				message = "unchangedType";
			} else if (
				isSafeContextualLocation(node) &&
				isSafeCallArgument(node, typeChecker) &&
				!typeContainsAny(originalType, typeChecker)
			) {
				const contextualType = typeChecker.getContextualType(node);
				if (
					contextualType &&
					typeChecker.isTypeAssignableTo(originalType, contextualType)
				) {
					message = "alreadyAccepted";
				}
			}

			if (!message) {
				return;
			}

			context.report({
				fix: getAssertionFix(node, expression, sourceFile),
				message,
				range: getTSNodeRange(node, sourceFile),
			});
		}

		function checkNonNull(
			node: AST.NonNullExpression,
			{ typeChecker }: TypeScriptFileServices,
		) {
			const parent = node.parent;
			if (
				parent.kind === SyntaxKind.BinaryExpression &&
				parent.operatorToken.kind === SyntaxKind.EqualsToken &&
				parent.right === node
			) {
				return;
			}

			const isAssignmentTarget =
				parent.kind === SyntaxKind.BinaryExpression &&
				parent.operatorToken.kind === SyntaxKind.EqualsToken &&
				parent.left === node;
			const actualType = typeChecker.getTypeAtLocation(node.expression);
			const constrainedType = getConstrainedTypeAtLocation(
				node.expression,
				typeChecker,
			);
			let message: "alreadyAccepted" | "unchangedType" | undefined;

			if (isAssignmentTarget) {
				message = "alreadyAccepted";
			} else if (
				!isPossiblyNullish(actualType) &&
				!isPossiblyNullish(constrainedType) &&
				!isPossiblyUnassignedIdentifier(node.expression, typeChecker)
			) {
				message = "unchangedType";
			} else if (
				actualType === constrainedType &&
				isSafeContextualLocation(node) &&
				isSafeCallArgument(node, typeChecker)
			) {
				const contextualType = typeChecker.getContextualType(node);
				if (
					contextualType &&
					typeChecker.isTypeAssignableTo(actualType, contextualType)
				) {
					message = "alreadyAccepted";
				}
			}

			if (!message) {
				return;
			}

			const end = node.getEnd();
			context.report({
				fix: { range: { begin: end - 1, end }, text: "" },
				message,
				range: { begin: end - 1, end },
			});
		}

		return {
			visitors: {
				AsExpression: checkAssertion,
				NonNullExpression: checkNonNull,
				TypeAssertionExpression: checkAssertion,
			},
		};
	},
});
