import { type AST, getTSNodeRange, typescriptLanguage } from "@flint.fyi/ts";
import { type SourceFile, SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports `context.report()` calls missing data for message placeholders.",
		id: "missingPlaceholders",
		presets: ["logical"],
	},
	messages: {
		missingPlaceholders: {
			primary: "Message template requires placeholders in the data object.",
			secondary: [
				"Message templates use `{{ placeholder }}` that must be provided via the data property.",
				"Each placeholder in the message template requires a corresponding key in the data object.",
			],
			suggestions: ["Add a data object with the required placeholder keys."],
		},
	},
	setup(context) {
		const messagesMap = new Map<string, Set<string>>();

		function checkMessageInCreateRule(ruleCreatorNode: AST.CallExpression) {
			const args = ruleCreatorNode.arguments[1];
			if (!args || args.kind !== SyntaxKind.ObjectLiteralExpression) {
				return;
			}

			const properties = args.properties;
			const messagesProperty = properties.find((prop) => {
				return (
					prop.kind === SyntaxKind.PropertyAssignment &&
					prop.name.kind === SyntaxKind.Identifier &&
					prop.name.text === "messages"
				);
			});

			if (
				!messagesProperty ||
				messagesProperty.kind !== SyntaxKind.PropertyAssignment ||
				messagesProperty.initializer.kind !== SyntaxKind.ObjectLiteralExpression
			) {
				return;
			}

			const messageProperties = messagesProperty.initializer.properties;
			const placeholderPattern = /\{\{\s*(\w+)\s*\}\}/g;

			for (const prop of messageProperties) {
				if (
					prop.kind !== SyntaxKind.PropertyAssignment ||
					prop.name.kind !== SyntaxKind.Identifier ||
					prop.initializer.kind !== SyntaxKind.ObjectLiteralExpression
				) {
					continue;
				}

				const messageId = prop.name.text;
				const placeholders = new Set<string>();
				const messageIdProperties = prop.initializer.properties;

				messageIdProperties.forEach((messageProp) => {
					if (
						messageProp.kind === SyntaxKind.PropertyAssignment &&
						messageProp.name.kind === SyntaxKind.Identifier
					) {
						if (messageProp.initializer.kind === SyntaxKind.StringLiteral) {
							const text = messageProp.initializer.text;
							let match = placeholderPattern.exec(text);
							while (match !== null) {
								if (match[1]) {
									placeholders.add(match[1]);
								}
								match = placeholderPattern.exec(text);
							}
						}

						if (
							messageProp.initializer.kind === SyntaxKind.ArrayLiteralExpression
						) {
							messageProp.initializer.elements.forEach((el) => {
								if (el.kind === SyntaxKind.StringLiteral) {
									const text = el.text;
									let match = placeholderPattern.exec(text);
									while (match !== null) {
										if (match[1]) {
											placeholders.add(match[1]);
										}
										match = placeholderPattern.exec(text);
									}
								}
							});
						}
					}
				});

				messagesMap.set(messageId, placeholders);
			}
		}

		function checkReportInCreateRule(
			contextNode: AST.CallExpression,
			sourceFile: SourceFile,
		) {
			const args = contextNode.arguments[0];
			if (!args || args.kind !== SyntaxKind.ObjectLiteralExpression) {
				return;
			}

			const properties = args.properties;
			const messageProperty = properties.find((prop) => {
				return (
					prop.kind === SyntaxKind.PropertyAssignment &&
					prop.name.kind === SyntaxKind.Identifier &&
					prop.name.text === "message"
				);
			});
			if (!messageProperty) {
				return;
			}

			const messageId =
				messageProperty.kind === SyntaxKind.PropertyAssignment &&
				messageProperty.initializer.kind === SyntaxKind.StringLiteral
					? messageProperty.initializer.text
					: null;

			if (!messageId) {
				return;
			}

			const requiredPlaceholders = messagesMap.get(messageId);
			if (!requiredPlaceholders || requiredPlaceholders.size === 0) {
				return;
			}

			const dataProperty = properties.find((prop) => {
				return (
					prop.kind === SyntaxKind.PropertyAssignment &&
					prop.name.kind === SyntaxKind.Identifier &&
					prop.name.text === "data"
				);
			});
			if (!dataProperty) {
				context.report({
					data: {
						placeholder: Array.from(requiredPlaceholders).join(", "),
					},
					message: "missingPlaceholders",
					range: getTSNodeRange(messageProperty, sourceFile),
				});
				return;
			}

			if (
				dataProperty.kind !== SyntaxKind.PropertyAssignment ||
				dataProperty.initializer.kind !== SyntaxKind.ObjectLiteralExpression
			) {
				return;
			}

			const dataKeys = new Set<string>();
			dataProperty.initializer.properties.forEach((prop) => {
				if (
					prop.kind === SyntaxKind.PropertyAssignment &&
					prop.name.kind === SyntaxKind.Identifier
				) {
					dataKeys.add(prop.name.text);
				} else if (prop.kind === SyntaxKind.ShorthandPropertyAssignment) {
					dataKeys.add(prop.name.text);
				}
			});

			const missingPlaceholders = new Set<string>();
			for (const placeholder of requiredPlaceholders) {
				if (!dataKeys.has(placeholder)) {
					missingPlaceholders.add(placeholder);
				}
			}

			if (missingPlaceholders.size > 0) {
				context.report({
					data: {
						placeholder: Array.from(missingPlaceholders).join(", "),
					},
					message: "missingPlaceholders",
					range: getTSNodeRange(messageProperty, sourceFile),
				});
			}
		}

		return {
			visitors: {
				CallExpression(node, { sourceFile, typeChecker }) {
					if (node.expression.kind !== SyntaxKind.PropertyAccessExpression) {
						return;
					}

					const propertyAccess = node.expression;

					const type = typeChecker.getTypeAtLocation(propertyAccess.expression);
					const typeName = type.getSymbol()?.getName();

					// TODO: Maybe need to check it more strictly
					if (
						typeName === "RuleCreator" &&
						propertyAccess.name.text === "createRule"
					) {
						checkMessageInCreateRule(node);
						return;
					}

					// TODO: Maybe need to check it more strictly
					if (
						typeName === "RuleContext" &&
						propertyAccess.name.text === "report"
					) {
						checkReportInCreateRule(node, sourceFile);
						return;
					}
				},
			},
		};
	},
});
