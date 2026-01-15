import { SyntaxKind } from "typescript";
import ts from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";
import type * as AST from "../types/ast.ts";
import { ruleCreator } from "./ruleCreator.ts";

function isCaptureStackTraceCall(node: ts.Node) {
	if (!ts.isCallExpression(node) && !ts.isOptionalChain(node)) {
		return false;
	}

	const callExpr = ts.isCallExpression(node) ? node : undefined;
	if (!callExpr) {
		if (ts.isCallExpression(node)) {
			return isCaptureStackTraceCall(node);
		}
		return false;
	}

	const callee = callExpr.expression;

	if (ts.isPropertyAccessExpression(callee)) {
		const object = callee.expression;
		const property = callee.name;

		if (
			ts.isIdentifier(object) &&
			object.text === "Error" &&
			ts.isIdentifier(property) &&
			property.text === "captureStackTrace"
		) {
			return true;
		}
	}

	return false;
}

function isErrorSubclass(node: AST.ClassDeclaration) {
	if (!node.heritageClauses) {
		return false;
	}

	for (const clause of node.heritageClauses) {
		if (clause.token !== SyntaxKind.ExtendsKeyword) {
			continue;
		}

		for (const type of clause.types) {
			const typeName = type.expression;
			if (ts.isIdentifier(typeName)) {
				const name = typeName.text;
				if (
					name === "Error" ||
					name === "TypeError" ||
					name === "RangeError" ||
					name === "SyntaxError" ||
					name === "ReferenceError" ||
					name === "EvalError" ||
					name === "URIError"
				) {
					return true;
				}
			}
		}
	}

	return false;
}

function isValidSecondArgument(
	node: ts.Expression,
	className: string | undefined,
): boolean {
	if (ts.isIdentifier(node)) {
		return node.text === className;
	}

	if (ts.isPropertyAccessExpression(node)) {
		if (
			node.expression.kind === SyntaxKind.ThisKeyword &&
			ts.isIdentifier(node.name) &&
			node.name.text === "constructor"
		) {
			return true;
		}
	}

	if (
		ts.isMetaProperty(node) &&
		node.keywordToken === SyntaxKind.NewKeyword &&
		ts.isIdentifier(node.name) &&
		node.name.text === "target"
	) {
		return true;
	}

	return false;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports unnecessary Error.captureStackTrace() calls in Error subclass constructors.",
		id: "errorUnnecessaryCaptureStackTraces",
		presets: ["logical"],
	},
	messages: {
		unnecessaryCaptureStackTrace: {
			primary:
				"Calling `Error.captureStackTrace()` is unnecessary in built-in Error subclass constructors.",
			secondary: [
				"The `Error` constructor automatically calls `Error.captureStackTrace()` when extending built-in Error types.",
				"Calling it again is redundant and adds unnecessary code.",
			],
			suggestions: ["Remove the `Error.captureStackTrace()` call."],
		},
	},
	setup(context) {
		return {
			visitors: {
				ClassDeclaration: (node, { sourceFile }) => {
					if (!isErrorSubclass(node)) {
						return;
					}

					for (const member of node.members) {
						if (!ts.isConstructorDeclaration(member) || !member.body) {
							continue;
						}

						for (const statement of member.body.statements) {
							if (
								!ts.isExpressionStatement(statement) ||
								!(
									ts.isCallExpression(statement.expression) ||
									ts.isCallChain(statement.expression)
								) ||
								!isCaptureStackTraceCall(statement.expression)
							) {
								continue;
							}

							const args = statement.expression.arguments;
							if (args.length < 1) {
								continue;
							}

							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							const firstArgument = args[0]!;
							if (firstArgument.kind !== SyntaxKind.ThisKeyword) {
								continue;
							}

							if (args.length >= 2) {
								// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
								const secondArgument = args[1]!;
								if (!isValidSecondArgument(secondArgument, node.name?.text)) {
									continue;
								}
							}

							context.report({
								message: "unnecessaryCaptureStackTrace",
								range: getTSNodeRange(statement, sourceFile),
							});
						}
					}
				},
			},
		};
	},
});
