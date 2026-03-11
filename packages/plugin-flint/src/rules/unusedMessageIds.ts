import type { CharacterReportRange } from "@flint.fyi/core";
import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import { SyntaxKind } from "typescript";

import { findProperty } from "../utils/findProperty.ts";
import {
	isRuleContextReport,
	isRuleCreatorCreateRule,
} from "../utils/ruleCreatorHelpers.ts";
import { ruleCreator } from "./ruleCreator.ts";
export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports message IDs defined in the messages object that are never used in context.report calls.",
		id: "unusedMessageIds",
		presets: ["logical"],
	},
	messages: {
		unusedMessageIds: {
			primary: "Message ID '{{ messageId }}' is defined but never used.",
			secondary: [
				"This message ID is declared in the messages object but is not referenced in any context.report call.",
				"Remove unused message IDs to keep the rule configuration clean and maintainable.",
			],
			suggestions: ["Remove the unused message ID from the messages object."],
		},
	},
	setup(context) {
		const unusedMessageIds = new Map<string, CharacterReportRange>();

		function collectMessageIds(
			node: AST.CallExpression,
			sourceFile: AST.SourceFile,
		) {
			const args = node.arguments[1];
			if (args?.kind !== SyntaxKind.ObjectLiteralExpression) {
				return;
			}
			const messagesProperty = findProperty(
				args.properties,
				"messages",
				(node) => node.kind === SyntaxKind.ObjectLiteralExpression,
			);

			if (!messagesProperty) {
				return;
			}

			for (const prop of messagesProperty.properties) {
				if (
					prop.kind !== SyntaxKind.PropertyAssignment ||
					prop.name.kind !== SyntaxKind.Identifier
				) {
					continue;
				}

				const messageId = prop.name.text;
				if (!unusedMessageIds.has(messageId)) {
					unusedMessageIds.set(
						messageId,
						getTSNodeRange(prop.name, sourceFile),
					);
				}
			}
		}

		function detectMessageIdUsage(node: AST.CallExpression) {
			if (!unusedMessageIds.size) {
				return;
			}

			const args = node.arguments[0];
			if (args?.kind !== SyntaxKind.ObjectLiteralExpression) {
				unusedMessageIds.clear();
				return;
			}

			// TODO: Use a util like getStaticValue
			// https://github.com/flint-fyi/flint/issues/1298
			const messageProperty = findProperty(
				args.properties,
				"message",
				(node) => node.kind === SyntaxKind.StringLiteral,
			);

			if (!messageProperty) {
				// TODO: It might be a template literal, variable reference, or other dynamic expression.
				// We can't statically determine the message ID here,
				// so don't report any unused message IDs in this file.
				unusedMessageIds.clear();
				return;
			}

			unusedMessageIds.delete(messageProperty.text);
		}

		return {
			visitors: {
				CallExpression(node, { sourceFile, typeChecker }) {
					if (isRuleCreatorCreateRule(node, typeChecker)) {
						collectMessageIds(node, sourceFile);
						return;
					}

					if (isRuleContextReport(node, typeChecker)) {
						detectMessageIdUsage(node);
						return;
					}
				},
				"SourceFile:exit"() {
					if (!unusedMessageIds.size) {
						return;
					}

					for (const [messageId, range] of unusedMessageIds) {
						context.report({
							data: {
								messageId,
							},
							message: "unusedMessageIds",
							range,
						});
					}

					unusedMessageIds.clear();
				},
			},
		};
	},
});
