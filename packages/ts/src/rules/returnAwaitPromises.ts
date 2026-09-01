import * as tsutils from "ts-api-utils";
import ts, { NodeFlags, SyntaxKind, TypeFlags } from "typescript";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
	type Checker,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

type Awaitability = "nonThenable" | "thenable" | "uncertain";
type FunctionNode =
	| AST.ArrowFunction
	| AST.FunctionDeclaration
	| AST.FunctionExpression
	| AST.MethodDeclaration;

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports missing awaits that affect returned-promise handling and unnecessary awaits on non-thenable return values.",
		id: "returnAwaitPromises",
		presets: ["logical"],
	},
	messages: {
		missingAwait: {
			primary:
				"Await this returned promise so its rejection is handled before the surrounding error handling or resource disposal completes.",
			secondary: [],
			suggestions: [],
		},
		unnecessaryAwait: {
			primary:
				"This returned value is not thenable, so awaiting it only changes completion timing.",
			secondary: [],
			suggestions: [],
		},
	},
	setup(context) {
		function checkExpression(
			expression: AST.Expression,
			owner: FunctionNode,
			services: TypeScriptFileServices,
		) {
			if (expression.kind === SyntaxKind.AwaitExpression) {
				if (
					classifyType(
						services.typeChecker.getTypeAtLocation(expression.expression),
						services.typeChecker,
						expression.expression,
					) === "nonThenable"
				) {
					reportUnnecessaryAwait(expression, services.sourceFile);
				}
				return;
			}

			if (
				!hasActiveErrorContext(expression, owner) &&
				!hasActiveResource(expression, owner)
			) {
				return;
			}

			reportThenableExpressions(expression, services);
		}

		function reportThenableExpressions(
			expression: AST.Expression,
			{
				sourceFile,
				typeChecker,
			}: Pick<TypeScriptFileServices, "sourceFile" | "typeChecker">,
		) {
			const awaitability = classifyType(
				typeChecker.getTypeAtLocation(expression),
				typeChecker,
				expression,
			);
			if (awaitability === "thenable") {
				const text = expression.getText(sourceFile);
				context.report({
					message: "missingAwait",
					range: getTSNodeRange(expression, sourceFile),
					suggestions: [
						{
							id: "addAwait",
							range: getTSNodeRange(expression, sourceFile),
							text: needsParentheses(expression)
								? `await (${text})`
								: `await ${text}`,
						},
					],
				});
				return;
			}

			const unwrapped = skipParentheses(expression);
			if (
				awaitability === "uncertain" &&
				unwrapped.kind === SyntaxKind.ConditionalExpression
			) {
				reportThenableExpressions(unwrapped.whenTrue, {
					sourceFile,
					typeChecker,
				});
				reportThenableExpressions(unwrapped.whenFalse, {
					sourceFile,
					typeChecker,
				});
			}
		}

		function reportUnnecessaryAwait(
			expression: AST.AwaitExpression,
			sourceFile: AST.SourceFile,
		) {
			const keywordEnd = expression.getStart(sourceFile) + "await".length;
			const operandStart = expression.expression.getStart(sourceFile);
			const removableEnd = /^\s*$/.test(
				sourceFile.text.slice(keywordEnd, operandStart),
			)
				? operandStart
				: keywordEnd;
			context.report({
				message: "unnecessaryAwait",
				range: {
					begin: expression.getStart(sourceFile),
					end: keywordEnd,
				},
				suggestions: [
					{
						id: "removeAwait",
						range: {
							begin: expression.getStart(sourceFile),
							end: removableEnd,
						},
						text: "",
					},
				],
			});
		}

		return {
			visitors: {
				ArrowFunction(node, services) {
					if (node.body.kind !== SyntaxKind.Block && isSupportedOwner(node)) {
						checkExpression(node.body, node, services);
					}
				},
				ReturnStatement(node, services) {
					if (!node.expression) {
						return;
					}

					const owner = findOwner(node);
					if (owner && isSupportedOwner(owner)) {
						checkExpression(node.expression, owner, services);
					}
				},
			},
		};
	},
});

function classifyThenType(
	type: ts.Type,
	typeChecker: Checker,
	location: ts.Node,
): Awaitability {
	if (type.flags & (TypeFlags.Any | TypeFlags.Unknown)) {
		return "uncertain";
	}
	if (tsutils.isUnionType(type)) {
		const [first, ...rest] = type.types.map((constituent) =>
			classifyThenType(constituent, typeChecker, location),
		) as [Awaitability, ...Awaitability[]];
		return rest.every((classification) => classification === first)
			? first
			: "uncertain";
	}

	const signatures = type.getCallSignatures();
	if (!signatures.length) {
		return "nonThenable";
	}

	let classification: Awaitability = "nonThenable";
	for (const signature of signatures) {
		const parameter = signature.getParameters()[0];
		if (!parameter) {
			continue;
		}
		const parameterType = typeChecker.getTypeOfSymbolAtLocation(
			parameter,
			location,
		);
		if (parameterType.flags & (TypeFlags.Any | TypeFlags.Unknown)) {
			classification = "uncertain";
			continue;
		}
		if (
			typeChecker.getNonNullableType(parameterType).getCallSignatures().length
		) {
			return "thenable";
		}
	}
	return classification;
}

function classifyType(
	type: ts.Type,
	typeChecker: Checker,
	location: ts.Node,
): Awaitability {
	if (type.flags & TypeFlags.TypeParameter) {
		const constraint = typeChecker.getBaseConstraintOfType(type);
		if (!constraint) {
			return "uncertain";
		}

		const classification = classifyType(constraint, typeChecker, location);
		return classification === "nonThenable" &&
			constraint.flags & TypeFlags.Object
			? "uncertain"
			: classification;
	}

	if (tsutils.isUnionType(type)) {
		const [first, ...rest] = type.types.map((constituent) =>
			classifyType(constituent, typeChecker, location),
		) as [Awaitability, ...Awaitability[]];
		return rest.every((classification) => classification === first)
			? first
			: "uncertain";
	}

	if (type.flags & (TypeFlags.Any | TypeFlags.Unknown)) {
		return "uncertain";
	}
	if (
		type.flags &
		(TypeFlags.Never |
			TypeFlags.Null |
			TypeFlags.Undefined |
			TypeFlags.StringLike |
			TypeFlags.NumberLike |
			TypeFlags.BigIntLike |
			TypeFlags.BooleanLike |
			TypeFlags.ESSymbolLike)
	) {
		return "nonThenable";
	}

	const apparentType = typeChecker.getApparentType(type);
	const then = apparentType.getProperty("then");
	if (!then) {
		return "nonThenable";
	}
	if (then.flags & ts.SymbolFlags.Optional) {
		return "uncertain";
	}

	const thenType = typeChecker.getTypeOfSymbolAtLocation(then, location);
	return classifyThenType(thenType, typeChecker, location);
}

function findOwner(node: AST.AnyNode): FunctionNode | undefined {
	for (
		let current = node.parent;
		current.kind !== SyntaxKind.SourceFile;
		current = current.parent
	) {
		if (tsutils.isFunctionScopeBoundary(current)) {
			return isFunctionNode(current) ? current : undefined;
		}
	}
	return undefined;
}

function hasActiveErrorContext(node: AST.AnyNode, owner: FunctionNode) {
	for (
		let current: ts.Node = node;
		current !== owner;
		current = current.parent
	) {
		const parent = current.parent;
		if (ts.isTryStatement(parent) && parent.tryBlock === current) {
			return true;
		}
		if (
			ts.isCatchClause(parent) &&
			ts.isTryStatement(parent.parent) &&
			parent.parent.finallyBlock
		) {
			return true;
		}
	}
	return false;
}

function hasActiveResource(node: AST.AnyNode, owner: FunctionNode) {
	for (
		let current: ts.Node = node;
		current !== owner;
		current = current.parent
	) {
		const parent = current.parent;
		if (ts.isBlock(parent) || ts.isSourceFile(parent)) {
			for (const statement of parent.statements) {
				if (
					statement === current ||
					statement.getStart(parent.getSourceFile()) >=
						current.getStart(parent.getSourceFile())
				) {
					break;
				}
				if (isUsingStatement(statement)) {
					return true;
				}
			}
		}
		if (
			(ts.isForStatement(parent) || ts.isForOfStatement(parent)) &&
			parent.statement === current &&
			parent.initializer &&
			ts.isVariableDeclarationList(parent.initializer) &&
			tsutils.isNodeFlagSet(parent.initializer, NodeFlags.Using)
		) {
			return true;
		}
	}
	return false;
}

function isFunctionNode(node: ts.Node): node is FunctionNode {
	return (
		ts.isArrowFunction(node) ||
		ts.isFunctionDeclaration(node) ||
		ts.isFunctionExpression(node) ||
		ts.isMethodDeclaration(node)
	);
}

function isSupportedOwner(node: FunctionNode) {
	return (
		!node.asteriskToken &&
		!!node.modifiers?.some(
			(modifier) => modifier.kind === SyntaxKind.AsyncKeyword,
		)
	);
}

function isUsingStatement(statement: ts.Statement) {
	return (
		ts.isVariableStatement(statement) &&
		tsutils.isNodeFlagSet(statement.declarationList, NodeFlags.Using)
	);
}

function needsParentheses(expression: AST.Expression) {
	return (
		expression.kind === SyntaxKind.AsExpression ||
		expression.kind === SyntaxKind.BinaryExpression ||
		expression.kind === SyntaxKind.ConditionalExpression ||
		expression.kind === SyntaxKind.SatisfiesExpression ||
		expression.kind === SyntaxKind.TypeAssertionExpression
	);
}

function skipParentheses(expression: AST.Expression): AST.Expression {
	while (expression.kind === SyntaxKind.ParenthesizedExpression) {
		expression = expression.expression;
	}
	return expression;
}
