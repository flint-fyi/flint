import { typescriptLanguage } from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

const referenceMatcher =
	/^\/\/\/\s*<\s*reference(?:\s+([\w-]+\s*=\s*"[^"]*"|[\w-]+\s*=\s*'[^']*'|[^\s/>]+))?\s*\/>/i;

const validDirectives = new Set(["lib", "no-default-lib", "path", "types"]);

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports invalid triple-slash reference directives.",
		id: "tripleSlashReferenceValidity",
		presets: ["logical"],
	},
	messages: {
		invalidDirective: {
			primary: "Invalid triple-slash reference directive format.",
			secondary: [
				"Only path, types, lib, and no-default-lib directives are valid TypeScript reference types.",
				"Triple-slash directives with incorrect reference types don't have any affect on types.",
			],
			suggestions: [
				'Use /// <reference types="..." />, /// <reference path="..." />, /// <reference lib="..." />, or /// <reference no-default-lib="true" />.',
			],
		},
	},
	setup(context) {
		function checkLine(line: string, position: number) {
			const trimmed = line.trimStart();
			if (!trimmed.startsWith("///")) {
				return;
			}

			const referenceMatch = referenceMatcher.exec(trimmed);
			if (!referenceMatch) {
				return;
			}

			const attributes = referenceMatch[1]?.trim();
			if (attributes) {
				const attributeMatch = /^([\w-]+)\s*=\s*["'][^"']*["']$/.exec(
					attributes,
				);
				if (
					attributeMatch &&
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					validDirectives.has(attributeMatch[1]!.toLowerCase())
				) {
					return;
				}
			}

			context.report({
				message: "invalidDirective",
				range: {
					begin: position + line.indexOf("///"),
					end: position + line.length,
				},
			});
		}

		return {
			visitors: {
				SourceFile(node) {
					const sourceText = node.getFullText();
					const lines = sourceText.split("\n");
					let position = 0;

					for (const line of lines) {
						checkLine(line, position);
						position += line.length + 1;
					}
				},
			},
		};
	},
});
