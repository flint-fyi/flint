import ts, { SyntaxKind } from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";
import * as AST from "../types/ast.ts";

export default typescriptLanguage.createRule({
	about: {
		description: "Disallow providing a body with GET or HEAD fetch requests.",
		id: "fetchMethodBodies",
		preset: "logical",
	},
	messages: {
		noBody: {
			primary: "`body` is not allowed when the request method is `{{method}}`.",
			secondary: [
				"The Fetch API will throw a `TypeError` at runtime if a body is provided with a `{{method}}` request.",
			],
			suggestions: [
				"Remove the `body` property from the options.",
				"Change the method to `POST`, `PUT`, or another method that supports request bodies.",
			],
		},
	},
	setup(context) {
		// TODO: Use a util like getStaticValue
		// https://github.com/flint-fyi/flint/issues/1298
		function isUndefinedOrNull(node: AST.Expression) {
			return (
				(node.kind === SyntaxKind.Identifier && node.text === "undefined") ||
				node.kind === SyntaxKind.NullKeyword
			);
		}

		function collectFetchOptions(node: AST.ObjectLiteralExpression) {
			let bodyName: AST.Identifier | undefined;
			let methodText: string | undefined;

			for (const property of node.properties) {
				switch (property.kind) {
					case SyntaxKind.PropertyAssignment: {
						// TODO: Use a util like getStaticValue
						// https://github.com/flint-fyi/flint/issues/1298
						if (property.name.kind !== SyntaxKind.Identifier) {
							return;
						}

						switch (property.name.text) {
							case "body":
								if (isUndefinedOrNull(property.initializer)) {
									return;
								}

								bodyName = property.name;
								break;

							case "method":
								if (property.initializer.kind !== SyntaxKind.StringLiteral) {
									return;
								}
								methodText = property.initializer.text;
								break;
						}
						break;
					}

					case SyntaxKind.SpreadAssignment:
						return;
				}
			}

			return { bodyName, methodText };
		}

		function checkFetchOptions(
			node: AST.Expression,
			sourceFile: ts.SourceFile,
		) {
			if (node.kind !== SyntaxKind.ObjectLiteralExpression) {
				return;
			}

			const collected = collectFetchOptions(node);
			if (!collected?.bodyName) {
				return;
			}

			const method = collected.methodText?.toUpperCase() ?? "GET";
			if (!["GET", "HEAD"].includes(method)) {
				return;
			}

			context.report({
				data: { method },
				message: "noBody",
				range: getTSNodeRange(collected.bodyName, sourceFile),
			});
		}

		function checkNode(
			node: AST.CallExpression | AST.NewExpression,
			functionName: string,
			sourceFile: ts.SourceFile,
		) {
			if (
				node.expression.kind === SyntaxKind.Identifier &&
				node.expression.text === functionName &&
				node.arguments &&
				node.arguments.length >= 2
			) {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				checkFetchOptions(node.arguments[1]!, sourceFile);
			}
		}

		return {
			visitors: {
				CallExpression: (node, { sourceFile }) => {
					checkNode(node, "fetch", sourceFile);
				},
				NewExpression: (node, { sourceFile }) => {
					checkNode(node, "Request", sourceFile);
				},
			},
		};
	},
});
