import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import {
	findMessagesProperty,
	forEachMessageString,
	getStringOriginalQuote,
	isRuleCreatorCreateRule,
} from "../utils/ruleCreatorHelpers.ts";
import { ruleCreator } from "./ruleCreator.ts";

function formatPlaceholders(text: string): string {
	return text.replaceAll(/\{\{\s*(\w+)\s*\}\}/g, "{{ $1 }}");
}

function hasMalformedPlaceholders(text: string): boolean {
	const matches = text.match(/\{\{\s*\w+\s*\}\}/g);
	if (!matches) {
		return false;
	}

	return matches.some((match) => !/\{\{ \w+ \}\}/.test(match));
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports and auto-fixes message placeholders that are not formatted as `{{ placeholder }}`.",
		id: "placeholderFormats",
		presets: ["stylistic"],
	},
	messages: {
		placeholderFormats: {
			primary:
				"Placeholders should be formatted with single spaces inside the braces.",
			secondary: [
				"Consistent formatting improves readability of message templates.",
				"Use exactly one space after the opening braces and before the closing braces.",
			],
			suggestions: ["Format placeholder with proper spacing."],
		},
	},
	setup(context) {
		function checkStringLiteral(
			node: AST.StringLiteral,
			sourceFile: AST.SourceFile,
		) {
			const text = node.text;
			if (!hasMalformedPlaceholders(text)) {
				return;
			}

			const fixedText = formatPlaceholders(text);
			const quote = getStringOriginalQuote(node, sourceFile);

			context.report({
				fix: {
					range: getTSNodeRange(node, sourceFile),
					text: `${quote}${fixedText}${quote}`,
				},
				message: "placeholderFormats",
				range: getTSNodeRange(node, sourceFile),
			});
		}

		return {
			visitors: {
				CallExpression(node, { sourceFile, typeChecker }) {
					if (!isRuleCreatorCreateRule(node, typeChecker)) {
						return;
					}

					const messagesProperty = findMessagesProperty(node);
					if (!messagesProperty) {
						return;
					}

					for (const ctx of forEachMessageString(messagesProperty)) {
						checkStringLiteral(ctx.node, sourceFile);
					}
				},
			},
		};
	},
});
