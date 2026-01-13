import { type AST, getTSNodeRange, typescriptLanguage } from "@flint.fyi/ts";
import { nullThrows } from "@flint.fyi/utils";
import { SyntaxKind } from "typescript";

export default typescriptLanguage.createRule({
	about: {
		description:
			"Prefer using classList.toggle() over conditional classList.add() and classList.remove().",
		id: "classListToggles",
		preset: "stylistic",
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
			if (node.kind !== SyntaxKind.ExpressionStatement) {
				return undefined;
			}

			const expression = node.expression;
			if (expression.kind !== SyntaxKind.CallExpression) {
				return undefined;
			}

			if (expression.expression.kind != SyntaxKind.PropertyAccessExpression) {
				return undefined;
			}

			const propertyAccess = expression.expression;
			const method = propertyAccess.name;

			if (
				method.kind != SyntaxKind.Identifier ||
				(method.text !== "add" && method.text !== "remove")
			) {
				return undefined;
			}

			if (
				propertyAccess.expression.kind != SyntaxKind.PropertyAccessExpression
			) {
				return undefined;
			}

			const classList = propertyAccess.expression;
			if (
				classList.name.kind != SyntaxKind.Identifier ||
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
			if (arg.kind != SyntaxKind.StringLiteral) {
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

			if (object.kind != SyntaxKind.Identifier) {
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

					const thenBlock =
						thenStatement.kind == SyntaxKind.Block
							? thenStatement.statements
							: [thenStatement];
					const elseBlock: readonly AST.Statement[] =
						elseStatement.kind == SyntaxKind.Block
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
					const thenCall = getClassListMethodCall(thenBlockStatement);
					const elseCall = getClassListMethodCall(elseBlockStatement);

					if (
						!thenCall ||
						!elseCall ||
						thenCall.className !== elseCall.className
					) {
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
						if (!elseInfo || thenInfo.object !== elseInfo.object) {
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
