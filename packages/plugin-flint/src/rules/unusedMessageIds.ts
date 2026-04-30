import type { CharacterReportRange } from "@flint.fyi/core";
import {
	type AST,
	type Checker,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import { SyntaxKind } from "typescript";

import { findProperty } from "../utils/findProperty.ts";
import {
	isImportedBindingFromModule,
	isImportedSpecifierFromModule,
} from "../utils/importHelpers.ts";
import {
	isRuleContextReport,
	isRuleCreatorCreateRule,
} from "../utils/ruleCreatorHelpers.ts";
import { ruleCreator } from "./ruleCreator.ts";

const volarLanguagePackageName = "@flint.fyi/volar-language";

function isVolarReportSourceCodeCall(
	node: AST.CallExpression,
	typeChecker: Checker,
) {
	// import { reportSourceCode } from "@flint.fyi/volar-language";
	// reportSourceCode(...)
	if (node.expression.kind === SyntaxKind.Identifier) {
		return (
			typeChecker
				.getSymbolAtLocation(node.expression)
				?.getDeclarations()
				?.some((declaration) =>
					isImportedSpecifierFromModule(
						declaration,
						volarLanguagePackageName,
						"reportSourceCode",
					),
				) ?? false
		);
	}

	// import * as VolarLanguage from "@flint.fyi/volar-language";
	// VolarLanguage.reportSourceCode(...)
	if (
		node.expression.kind === SyntaxKind.PropertyAccessExpression &&
		node.expression.expression.kind === SyntaxKind.Identifier &&
		node.expression.name.text === "reportSourceCode"
	) {
		return (
			typeChecker
				.getSymbolAtLocation(node.expression.expression)
				?.getDeclarations()
				?.some(
					(declaration) =>
						declaration.kind === SyntaxKind.NamespaceImport &&
						isImportedBindingFromModule(declaration, volarLanguagePackageName),
				) ?? false
		);
	}

	return false;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports message IDs defined in the messages object that are never used in recognized report calls.",
		id: "unusedMessageIds",
		presets: ["logical"],
	},
	messages: {
		unusedMessageIds: {
			primary: "Message ID '{{ messageId }}' is defined but never used.",
			secondary: [
				"This message ID is declared in the messages object but is not referenced in any `context.report()` or built-in Flint report helper call.",
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

		function detectMessageIdUsage(
			node: AST.CallExpression,
			reportArgumentIndex: number,
		) {
			if (!unusedMessageIds.size) {
				return;
			}

			const args = node.arguments[reportArgumentIndex];
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
						detectMessageIdUsage(node, 0);
						return;
					}

					if (isVolarReportSourceCodeCall(node, typeChecker)) {
						detectMessageIdUsage(node, 1);
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
