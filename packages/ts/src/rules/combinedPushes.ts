import { SyntaxKind } from "typescript-native/unstable/ast";

import {
	typescriptLanguage,
	type AST,
	type Checker,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports consecutive array.push() calls that could be combined into a single call.",
		id: "combinedPushes",
		presets: ["stylistic", "stylisticStrict"],
	},
	messages: {
		combinePushes: {
			primary:
				"Consecutive `.push()` calls can be combined into a single call.",
			secondary: [
				"Multiple consecutive `.push()` calls on the same array can be combined.",
				"Use `.push(a, b, c)` instead of separate `.push(a)`, `.push(b)`, `.push(c)` calls.",
			],
			suggestions: ["Combine consecutive `.push()` calls into one."],
		},
	},
	setup(context) {
		function isArrayPushCall(
			node: AST.CallExpression,
			checker: Checker,
		): boolean {
			return (
				node.expression.kind === SyntaxKind.PropertyAccessExpression &&
				node.expression.name.text === "push" &&
				checker.isArrayType(
					checker.getTypeAtLocation(node.expression.expression),
				)
			);
		}

		function getArrayName(
			node: AST.CallExpression,
			sourceFile: AST.SourceFile,
		): false | string {
			return (
				node.expression.kind === SyntaxKind.PropertyAccessExpression &&
				node.expression.expression.getText(sourceFile)
			);
		}

		function isPushCallStatement(
			statement: AST.Statement,
			sourceFile: AST.SourceFile,
			checker: Checker,
		): undefined | { arrayName: string; callExpression: AST.CallExpression } {
			if (
				statement.kind !== SyntaxKind.ExpressionStatement ||
				statement.expression.kind !== SyntaxKind.CallExpression ||
				!isArrayPushCall(statement.expression, checker)
			) {
				return undefined;
			}

			const arrayName = getArrayName(statement.expression, sourceFile);
			if (!arrayName) {
				return undefined;
			}

			return {
				arrayName,
				callExpression: statement.expression,
			};
		}

		function checkNode(
			{ statements }: AST.Block | AST.SourceFile,
			{ checker, sourceFile }: TypeScriptFileServices,
		): void {
			for (let i = 0; i < statements.length - 1; i += 1) {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const currentStatement = statements[i]!;
				const currentPush = isPushCallStatement(
					currentStatement,
					sourceFile,
					checker,
				);
				if (!currentPush) {
					continue;
				}

				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const nextStatement = statements[i + 1]!;
				const nextPush = isPushCallStatement(
					nextStatement,
					sourceFile,
					checker,
				);

				if (nextPush?.arrayName === currentPush.arrayName) {
					context.report({
						message: "combinePushes",
						range: {
							begin: currentStatement.getStart(sourceFile),
							end: nextStatement.getEnd(),
						},
					});
				}
			}
		}

		return {
			visitors: {
				Block: checkNode,
				SourceFile: checkNode,
			},
		};
	},
});
