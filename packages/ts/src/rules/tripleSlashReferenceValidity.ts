import { typescriptLanguage } from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

const validDirectives = new Set(["path", "types", "lib", "no-default-lib"]);

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
				"Only path, types, lib, and no-default-lib directives are allowed.",
			],
			suggestions: [
				'Use /// <reference types="..." />, /// <reference path="..." />, /// <reference lib="..." />, or /// <reference no-default-lib="true" />.',
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				SourceFile(_node, { sourceFile }) {
					const sourceText = sourceFile.getFullText();
					const lines = sourceText.split("\n");
					let currentPos = 0;

					for (const line of lines) {
						const trimmed = line.trimStart();

						if (trimmed.startsWith("///")) {
							const referenceMatch = trimmed.match(
								/^\/\/\/\s*<\s*reference\s+([^>]*)\s*\/>/i,
							);

							if (referenceMatch) {
								const attributes = referenceMatch[1].trim();
								const attrMatch = attributes.match(
									/^([\w-]+)\s*=\s*["'][^"']*["']$/,
								);

								if (
									!attrMatch ||
									!validDirectives.has(attrMatch[1].toLowerCase())
								) {
									const refStart = line.indexOf("///");
									context.report({
										message: "invalidDirective",
										range: {
											begin: currentPos + refStart,
											end: currentPos + line.length,
										},
									});
								}
							}
						}

						currentPos += line.length + 1;
					}
				},
			},
		};
	},
});
