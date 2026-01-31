import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";
import { getConstrainedTypeAtLocation } from "./utils/getConstrainedType.ts";
import { isBuiltinSymbolLike } from "./utils/isBuiltinSymbolLike.ts";

function getRegexFlags(node: AST.Expression, sourceFile: AST.SourceFile) {
	switch (node.kind) {
		case ts.SyntaxKind.CallExpression:
		case ts.SyntaxKind.NewExpression:
			if (
				ts.isIdentifier(node.expression) &&
				node.expression.text === "RegExp" &&
				node.arguments
			) {
				if (node.arguments.length < 2) {
					return "";
				}

				const flagsArg = node.arguments[1];

				if (flagsArg && ts.isStringLiteral(flagsArg)) {
					return flagsArg.text;
				}
			}

			return undefined;

		case ts.SyntaxKind.RegularExpressionLiteral: {
			const text = node.getText(sourceFile);
			const lastSlash = text.lastIndexOf("/");
			return lastSlash >= 0 ? text.slice(lastSlash + 1) : "";
		}

		default:
			return undefined;
	}
}

function isInBooleanContext(node: AST.AnyNode): boolean {
	switch (node.parent.kind) {
		case ts.SyntaxKind.AsExpression:
		case ts.SyntaxKind.NonNullExpression:
		case ts.SyntaxKind.ParenthesizedExpression:
			return isInBooleanContext(node.parent);

		case ts.SyntaxKind.BinaryExpression: {
			return (
				node.parent.operatorToken.kind ===
					ts.SyntaxKind.AmpersandAmpersandToken ||
				node.parent.operatorToken.kind === ts.SyntaxKind.BarBarToken
			);
		}

		case ts.SyntaxKind.CallExpression: {
			return (
				ts.isIdentifier(node.parent.expression) &&
				node.parent.expression.text === "Boolean" &&
				node.parent.arguments.length === 1 &&
				node.parent.arguments[0] === node
			);
		}

		case ts.SyntaxKind.ConditionalExpression:
		case ts.SyntaxKind.ForStatement:
			return node.parent.condition === node;

		case ts.SyntaxKind.DoStatement:
		case ts.SyntaxKind.IfStatement:
		case ts.SyntaxKind.WhileStatement:
			return node.parent.expression === node;

		case ts.SyntaxKind.PrefixUnaryExpression:
			return node.parent.operator === ts.SyntaxKind.ExclamationToken;

		default:
			return false;
	}
}

function needsParentheses(node: AST.AnyNode) {
	return !(
		ts.isIdentifier(node) ||
		ts.isRegularExpressionLiteral(node) ||
		ts.isParenthesizedExpression(node) ||
		ts.isCallExpression(node) ||
		ts.isNewExpression(node)
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports match() and exec() calls that should use RegExp.prototype.test() for boolean checks.",
		id: "regexTestMethods",
		presets: ["stylistic", "stylisticStrict"],
	},
	messages: {
		preferTest: {
			primary:
				"Prefer the faster `RegExp.test()` for boolean checks instead of the slower `RegExp.{{ method }}()`.",
			secondary: [
				"`RegExp.prototype.test()` is more efficient and semantically clearer when only checking for existence.",
				"`RegExp.prototype.exec()` returns a full matches array, including capture groups, which is slower to execute.",
			],
			suggestions: [
				"Replace with `RegExp.prototype.test()` for boolean context checks.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression: (node, { program, sourceFile, typeChecker }) => {
					if (
						!ts.isPropertyAccessExpression(node.expression) ||
						node.arguments.length !== 1
					) {
						return;
					}

					// TODO: Use a util like getStaticValue
					// https://github.com/flint-fyi/flint/issues/1298
					const methodName = node.expression.name.text;

					if (methodName !== "match" && methodName !== "exec") {
						return;
					}

					if (!isInBooleanContext(node)) {
						return;
					}

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const argument = node.arguments[0]!;

					const range = getTSNodeRange(node, sourceFile);

					if (methodName === "exec") {
						const objectType = getConstrainedTypeAtLocation(
							node.expression.expression,
							typeChecker,
						);
						if (!isBuiltinSymbolLike(program, objectType, "RegExp")) {
							return;
						}

						const flags = getRegexFlags(node.expression.expression, sourceFile);
						const hasGlobalFlag = flags === undefined || flags.includes("g");

						context.report({
							data: { method: "exec" },
							fix: hasGlobalFlag
								? undefined
								: {
										range,
										text: `${node.expression.expression.getText(sourceFile)}.test(${argument.getText(sourceFile)})`,
									},
							message: "preferTest",
							range,
						});

						return;
					}

					const objectType = getConstrainedTypeAtLocation(
						node.expression.expression,
						typeChecker,
					);
					if (!(objectType.flags & ts.TypeFlags.StringLike)) {
						return;
					}

					const argumentType = getConstrainedTypeAtLocation(
						argument,
						typeChecker,
					);
					if (!isBuiltinSymbolLike(program, argumentType, "RegExp")) {
						return;
					}

					const flags = getRegexFlags(argument, sourceFile);
					const hasGlobalFlag = flags === undefined || flags.includes("g");

					const regexText = needsParentheses(argument)
						? `(${argument.getText(sourceFile)})`
						: argument.getText(sourceFile);

					context.report({
						data: { method: "match" },
						fix: hasGlobalFlag
							? undefined
							: {
									range,
									text: `${regexText}.test(${node.expression.expression.getText(sourceFile)})`,
								},
						message: "preferTest",
						range,
					});
				},
			},
		};
	},
});
