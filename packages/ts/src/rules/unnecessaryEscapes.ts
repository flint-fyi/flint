import {
	type AST,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

const validEscapes = new Set([
	"b",
	"f",
	"n",
	"r",
	"t",
	"v",
	"0",
	"\\",
	"'",
	'"',
	"`",
]);

interface UnnecessaryEscape {
	character: string;
	end: number;
	start: number;
}

function findUnnecessaryEscapes(
	fullText: string,
	quoteChar: string,
): UnnecessaryEscape[] {
	const escapes: UnnecessaryEscape[] = [];

	let startIndex = 1;
	let endIndex = fullText.length - 1;

	if (quoteChar === "`") {
		if (fullText.endsWith("${")) {
			endIndex = fullText.length - 2;
		}
		if (fullText.startsWith("}`")) {
			startIndex = 2;
		}
	}

	let index = startIndex;

	while (index < endIndex) {
		if (fullText[index] === "\\") {
			const nextChar = fullText[index + 1];

			if (!nextChar || index + 1 >= endIndex) {
				break;
			}

			if (validEscapes.has(nextChar)) {
				index += 2;
				continue;
			}

			if (nextChar === "x") {
				if (/^[0-9A-Fa-f]{2}/.test(fullText.slice(index + 2, index + 4))) {
					index += 4;
					continue;
				}
			} else if (nextChar === "u") {
				const afterU = fullText.slice(index + 2);
				if (/^[0-9A-Fa-f]{4}/.test(afterU)) {
					index += 6;
					continue;
				}
				if (afterU.startsWith("{")) {
					const closeBrace = afterU.indexOf("}");
					if (
						closeBrace > 1 &&
						/^[0-9A-Fa-f]+$/.test(afterU.slice(1, closeBrace))
					) {
						index += 3 + closeBrace;
						continue;
					}
				}
			} else if (nextChar === "c") {
				const charAfterC = fullText[index + 2];
				if (charAfterC && /[A-Za-z]/.test(charAfterC)) {
					index += 3;
					continue;
				}
			} else if (/[1-7]/.test(nextChar)) {
				index += 2;
				continue;
			} else if (/[89]/.test(nextChar)) {
				index += 2;
				continue;
			}

			if (nextChar !== quoteChar || quoteChar === "`") {
				escapes.push({
					character: nextChar,
					end: index + 2,
					start: index,
				});
			}

			index += 2;
		} else {
			index += 1;
		}
	}

	return escapes;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports unnecessary escape sequences in string literals and template strings.",
		id: "unnecessaryEscapes",
		presets: ["stylistic"],
	},
	messages: {
		unnecessary: {
			primary: "Unnecessary escape for character '{{ character }}'.",
			secondary: [
				"This character does not require escaping in this context.",
				"Removing the backslash makes the code clearer without changing its meaning.",
			],
			suggestions: ["Remove the unnecessary backslash."],
		},
	},
	setup(context) {
		function checkNode(
			node:
				| AST.NoSubstitutionTemplateLiteral
				| AST.StringLiteral
				| AST.TemplateHead
				| AST.TemplateMiddle
				| AST.TemplateTail,
			{ sourceFile }: TypeScriptFileServices,
		) {
			const fullText = node.getText(sourceFile);
			let quoteChar = "'";

			if (node.kind === ts.SyntaxKind.StringLiteral) {
				quoteChar = fullText[0] === '"' ? '"' : "'";
			} else {
				quoteChar = "`";
			}

			const escapes = findUnnecessaryEscapes(fullText, quoteChar);

			for (const escape of escapes) {
				const nodeStart = node.getStart(sourceFile);
				const escapeStart = nodeStart + escape.start;
				const escapeEnd = nodeStart + escape.end;

				context.report({
					data: {
						character: escape.character,
					},
					fix: {
						range: {
							begin: escapeStart,
							end: escapeStart + 1,
						},
						text: "",
					},
					message: "unnecessary",
					range: {
						begin: escapeStart,
						end: escapeEnd,
					},
				});
			}
		}

		return {
			visitors: {
				NoSubstitutionTemplateLiteral: checkNode,
				StringLiteral: checkNode,
				TemplateExpression: (node, services) => {
					checkNode(node.head, services);

					for (const span of node.templateSpans) {
						checkNode(span.literal, services);
					}
				},
			},
		};
	},
});
