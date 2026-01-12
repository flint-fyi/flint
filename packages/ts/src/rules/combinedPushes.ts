import ts from "typescript";

import type { Checker, TypeScriptFileServices } from "../index.ts";
import { typescriptLanguage } from "../language.ts";
import type * as AST from "../types/ast.ts";

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports consecutive array.push() calls that could be combined into a single call.",
		id: "combinedPushes",
		preset: "stylistic",
		strictness: "strict",
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
		function isArrayPushCall(node: AST.CallExpression, typeChecker: Checker) {
			return (
				ts.isPropertyAccessExpression(node.expression) &&
				node.expression.name.text === "push" &&
				typeChecker.isArrayType(
					typeChecker.getTypeAtLocation(node.expression.expression),
				)
			);
		}

		function getArrayName(node: AST.CallExpression, sourceFile: ts.SourceFile) {
			return (
				ts.isPropertyAccessExpression(node.expression) &&
				node.expression.expression.getText(sourceFile)
			);
		}

		function isPushCallStatement(
			statement: AST.Statement,
			sourceFile: ts.SourceFile,
			typeChecker: Checker,
		) {
			if (
				!ts.isExpressionStatement(statement) ||
				!ts.isCallExpression(statement.expression) ||
				!isArrayPushCall(statement.expression, typeChecker)
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
			{ sourceFile, typeChecker }: TypeScriptFileServices,
		) {
			for (let i = 0; i < statements.length - 1; i += 1) {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const currentStatement = statements[i]!;
				const currentPush = isPushCallStatement(
					currentStatement,
					sourceFile,
					typeChecker,
				);
				if (!currentPush) {
					continue;
				}

				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const nextStatement = statements[i + 1]!;
				const nextPush = isPushCallStatement(
					nextStatement,
					sourceFile,
					typeChecker,
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
