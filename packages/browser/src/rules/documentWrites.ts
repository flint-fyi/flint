import { SyntaxKind } from "typescript";

import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { isGlobalDocumentReference } from "./isGlobalDocumentReference.ts";
import { ruleCreator } from "./ruleCreator.ts";

const documentWriteNames = new Set(["write", "writeln"]);

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports uses of `document.write()` and `document.writeln()` which block HTML parsing.",
		id: "documentWrites",
		presets: ["logical"],
	},
	messages: {
		noWrite: {
			primary:
				"`document.{{ method }}()` blocks HTML parsing and can introduce injection risks.",
			secondary: [
				"These methods write strings into the document stream while HTML is being parsed.",
				"They can block page loading and make string-built markup vulnerable to script injection.",
			],
			suggestions: [
				"Create DOM nodes with `document.createElement()` and insert them with modern DOM methods.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression(node, { sourceFile, typeChecker }) {
					const { expression } = node;
					if (
						expression.kind === SyntaxKind.PropertyAccessExpression &&
						documentWriteNames.has(expression.name.text) &&
						isGlobalDocumentReference(expression.expression, typeChecker)
					) {
						context.report({
							data: { method: expression.name.text },
							message: "noWrite",
							range: getTSNodeRange(expression.name, sourceFile),
						});
					}
				},
			},
		};
	},
});
