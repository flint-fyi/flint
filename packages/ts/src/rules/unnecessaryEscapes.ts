import {
	type AST,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

const validEscapes = new Set([
	"0",
	'"',
	"'",
	"\\",
	"`",
	"b",
	"f",
	"n",
	"r",
	"t",
	"v",
]);

interface UnnecessaryEscape {
	character: string;
	end: number;
	start: number;
}

function findUnnecessaryEscapes(
	fullText: string,
	quoteCharacter: string,
): UnnecessaryEscape[] {
	const escapes: UnnecessaryEscape[] = [];

	let startIndex = 1;
	let endIndex = fullText.length - 1;

	if (quoteCharacter === "`") {
		if (fullText.endsWith("${")) {
			endIndex = fullText.length - 2;
		}
		if (fullText.startsWith("}`")) {
			startIndex = 2;
		}
	}

	let index = startIndex;

	while (index < endIndex) {
		if (fullText[index] !== "\\") {
			index += 1;
			continue;
		}

		const nextCharacter = fullText[index + 1];

		if (!nextCharacter || index + 1 >= endIndex) {
			break;
		}

		if (validEscapes.has(nextCharacter)) {
			index += 2;
			continue;
		}

		switch (nextCharacter) {
			case "c": {
				const characterAfterC = fullText[index + 2];
				if (characterAfterC && /[a-z]/i.test(characterAfterC)) {
					index += 3;
					continue;
				}
				break;
			}

			case "u": {
				const afterU = fullText.slice(index + 2);
				if (/^[\da-f]{4}/i.test(afterU)) {
					index += 6;
					continue;
				}
				if (afterU.startsWith("{")) {
					const closeBrace = afterU.indexOf("}");
					if (
						closeBrace > 1 &&
						/^[\da-f]+$/i.test(afterU.slice(1, closeBrace))
					) {
						index += 3 + closeBrace;
						continue;
					}
				}
				break;
			}

			case "x":
				if (/^[\da-f]{2}/i.test(fullText.slice(index + 2, index + 4))) {
					index += 4;
					continue;
				}
				break;

			default:
				if (/[1-9]/.test(nextCharacter)) {
					index += 2;
					continue;
				}
		}

		if (nextCharacter !== quoteCharacter) {
			escapes.push({
				character: nextCharacter,
				end: index + 2,
				start: index,
			});
		}

		index += 2;
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
				quoteChar = fullText.startsWith('"') ? '"' : "'";
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
