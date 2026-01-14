import type * as ts from "typescript";

import { typescriptLanguage } from "../language.ts";
import * as AST from "../types/ast.ts";
import { ruleCreator } from "./ruleCreator.ts";

interface EscapeInfo {
	index: number;
	length: number;
	original: string;
	fixed: string;
}

function findLowercaseEscapeSequence(text: string): EscapeInfo | undefined {
	const patterns = [
		/\\x([0-9a-f]{2})/g,
		/\\u([0-9a-f]{4})/g,
		/\\u\{([0-9a-f]+)\}/g,
		/\\c([a-z])/g,
	];

	for (const pattern of patterns) {
		let match: RegExpExecArray | null;
		while ((match = pattern.exec(text)) !== null) {
			const hexPart = match[1];
			if (hexPart && hexPart !== hexPart.toUpperCase()) {
				const original = match[0];
				const fixed = original.toUpperCase();
				return {
					fixed,
					index: match.index,
					length: original.length,
					original,
				};
			}
		}
	}

	return undefined;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports escape sequences with lowercase hexadecimal characters.",
		id: "escapeSequenceCasing",
		presets: ["stylisticStrict"],
	},
	messages: {
		useUppercase: {
			primary: "Use uppercase characters for escape sequence '{{ original }}'.",
			secondary: [
				"Uppercase hexadecimal characters in escape sequences are more readable and distinguishable from identifiers.",
			],
			suggestions: ["Change '{{ original }}' to '{{ fixed }}'."],
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
			sourceFile: ts.SourceFile,
		) {
			const text = node.getText(sourceFile);
			const escapeInfo = findLowercaseEscapeSequence(text);

			if (!escapeInfo) {
				return;
			}

			const nodeStart = node.getStart(sourceFile);
			context.report({
				data: {
					fixed: escapeInfo.fixed,
					original: escapeInfo.original,
				},
				message: "useUppercase",
				range: {
					begin: nodeStart + escapeInfo.index,
					end: nodeStart + escapeInfo.index + escapeInfo.length,
				},
				suggestions: [
					{
						id: "replaceWithUppercase",
						range: {
							begin: nodeStart + escapeInfo.index,
							end: nodeStart + escapeInfo.index + escapeInfo.length,
						},
						text: escapeInfo.fixed,
					},
				],
			});
		}

		return {
			visitors: {
				NoSubstitutionTemplateLiteral: (node, { sourceFile }) => {
					checkNode(node, sourceFile);
				},
				StringLiteral: (node, { sourceFile }) => {
					checkNode(node, sourceFile);
				},
				TemplateExpression: (node, { sourceFile }) => {
					checkNode(node.head, sourceFile);

					for (const span of node.templateSpans) {
						checkNode(span.literal, sourceFile);
					}
				},
			},
		};
	},
});
