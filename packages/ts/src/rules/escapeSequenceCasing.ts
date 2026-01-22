import {
	type AST,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

interface EscapeInfo {
	fixed: string;
	index: number;
	length: number;
	original: string;
}

const escapeCase =
	/(?<=(?:^|[^\\])(?:\\\\)*\\)(?:x[\dA-Fa-f]{2}|u[\dA-Fa-f]{4}|u\{[\dA-Fa-f]+\}|c[a-z])/g;

function findLowercaseEscapeSequence(text: string): EscapeInfo | undefined {
	const patterns = [
		/\\x([0-9a-f]{2})/g,
		/\\u([0-9a-f]{4})/g,
		/\\u\{([0-9a-f]+)\}/g,
		/\\c([a-z])/g,
	];

	for (const pattern of patterns) {
		let match: null | RegExpExecArray;
		while ((match = pattern.exec(text)) !== null) {
			const hexPart = match[1];
			if (hexPart && hexPart !== hexPart.toUpperCase()) {
				const original = match[0];
				const fixed = original.replace(
					escapeCase,
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					(data) => data[0]! + data.slice(1).toUpperCase(),
				);
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
			primary:
				"Prefer uppercase characters for escape sequence '{{ original }}'.",
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
			{ sourceFile }: TypeScriptFileServices,
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
				fix: {
					range: {
						begin: nodeStart + escapeInfo.index,
						end: nodeStart + escapeInfo.index + escapeInfo.length,
					},
					text: escapeInfo.fixed,
				},
				message: "useUppercase",
				range: {
					begin: nodeStart + escapeInfo.index,
					end: nodeStart + escapeInfo.index + escapeInfo.length,
				},
			});
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
