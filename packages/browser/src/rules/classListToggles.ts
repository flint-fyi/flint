import {
	isBlock,
	isCallExpression,
	isExpressionStatement,
	isIdentifier,
	isPropertyAccessExpression,
	isStringLiteral,
} from "typescript-native/unstable/ast";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
} from "@flint.fyi/typescript-language";
import { nullThrows } from "@flint.fyi/utils";

import { ruleCreator } from "./ruleCreator.ts";
import { isASTStatement } from "./typeGuards.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Prefer using classList.toggle() over conditional classList.add() and classList.remove().",
		id: "classListToggles",
		presets: ["stylistic", "stylisticStrict"],
	},
	messages: {
		preferToggle: {
			primary:
				"Prefer using `classList.toggle()` instead of conditional `classList.add()` and `classList.remove()`.",
			secondary: [
				"The `classList.toggle()` method is more concise and expressive for conditional class name changes.",
				"Using `toggle()` reduces code duplication and makes the intent clearer.",
			],
			suggestions: [
				"Replace the conditional `classList.add()` and `classList.remove()` calls with a single `classList.toggle()` call.",
			],
		},
	},
	setup(context) {
		function getClassListMethodCall(node: AST.Statement) {
			if (!isExpressionStatement(node)) {
				return undefined;
			}

			const expression = node.expression;
			if (!isCallExpression(expression)) {
				return undefined;
			}

			if (!isPropertyAccessExpression(expression.expression)) {
				return undefined;
			}

			const propertyAccess = expression.expression;
			const method = propertyAccess.name;

			if (
				!isIdentifier(method) ||
				(method.text !== "add" && method.text !== "remove")
			) {
				return undefined;
			}

			if (!isPropertyAccessExpression(propertyAccess.expression)) {
				return undefined;
			}

			const classList = propertyAccess.expression;
			if (
				!isIdentifier(classList.name) ||
				classList.name.text !== "classList"
			) {
				return undefined;
			}

			const args = expression.arguments;
			if (args.length !== 1) {
				return undefined;
			}

			const arg = nullThrows(
				args[0],
				"Argument is expected to be present by earlier length check",
			);
			if (!isStringLiteral(arg)) {
				return undefined;
			}

			return {
				className: arg.text,
				method: method.text,
				methodNode: method,
			};
		}

		function getObjectAndClassName(node: AST.Statement) {
			const call = getClassListMethodCall(node);
			if (!call) {
				return undefined;
			}

			const exprStatement = node as AST.ExpressionStatement;
			const callExpr = exprStatement.expression as AST.CallExpression;
			const propertyAccess =
				callExpr.expression as AST.PropertyAccessExpression;
			const classList =
				propertyAccess.expression as AST.PropertyAccessExpression;
			const object = classList.expression;

			if (!isIdentifier(object)) {
				return undefined;
			}

			return {
				className: call.className,
				object: object.text,
			};
		}

		return {
			visitors: {
				IfStatement(node, { sourceFile }) {
					const thenStatement = node.thenStatement;
					const elseStatement = node.elseStatement;

					if (!elseStatement) {
						return;
					}

					const thenBlock = isBlock(thenStatement)
						? thenStatement.statements
						: [thenStatement];
					const elseBlock = isBlock(elseStatement)
						? elseStatement.statements
						: [elseStatement];

					if (thenBlock.length !== 1 || elseBlock.length !== 1) {
						return;
					}

					const thenBlockStatement = nullThrows(
						thenBlock[0],
						"Then block statement is expected to be present by prior length check",
					);
					const elseBlockStatement = nullThrows(
						elseBlock[0],
						"Else block statement is expected to be present by prior length check",
					);
					if (
						!isASTStatement(thenBlockStatement) ||
						!isASTStatement(elseBlockStatement)
					) {
						return;
					}

					const thenCall = getClassListMethodCall(thenBlockStatement);
					const elseCall = getClassListMethodCall(elseBlockStatement);

					if (!thenCall || thenCall.className !== elseCall?.className) {
						return;
					}

					if (
						(thenCall.method === "add" && elseCall.method === "remove") ||
						(thenCall.method === "remove" && elseCall.method === "add")
					) {
						const thenInfo = getObjectAndClassName(thenBlockStatement);
						if (!thenInfo) {
							return;
						}

						const elseInfo = getObjectAndClassName(elseBlockStatement);
						if (thenInfo.object !== elseInfo?.object) {
							return;
						}

						const condition = node.expression;
						const conditionText = condition.getText(sourceFile);
						const className = thenCall.className;
						const toggleSecondArg =
							thenCall.method === "add" ? conditionText : `!(${conditionText})`;

						const ifStart = node.getStart(sourceFile);
						const ifEnd = node.getEnd();

						context.report({
							fix: {
								range: {
									begin: ifStart,
									end: ifEnd,
								},
								text: `${thenInfo.object}.classList.toggle("${className}", ${toggleSecondArg});`,
							},
							message: "preferToggle",
							range: getTSNodeRange(thenCall.methodNode, sourceFile),
						});
					}
				},
			},
		};
	},
});
