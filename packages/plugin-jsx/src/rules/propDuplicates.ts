import {
	type AST,
	getTSNodeRange,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/ts";
import { SyntaxKind } from "typescript";

export default typescriptLanguage.createRule({
	about: {
		description: "Disallow duplicate props in JSX elements.",
		id: "propDuplicates",
		preset: "logical",
	},
	messages: {
		duplicateProp: {
			primary:
				"Duplicate prop `{{ propName }}` found in JSX element. The last occurrence will override earlier ones.",
			secondary: [
				"Having duplicate props can lead to unexpected behavior since only the last value is used.",
				"This makes the code harder to understand and maintain.",
			],
			suggestions: ["Remove the duplicate prop and keep only one definition."],
		},
	},
	setup(context) {
		function checkElement(
			node: AST.JsxOpeningElement | AST.JsxSelfClosingElement,
			{ sourceFile }: TypeScriptFileServices,
		) {
			const seenProps = new Set<string>();

			for (const property of node.attributes.properties) {
				if (
					property.kind !== SyntaxKind.JsxAttribute ||
					property.name.kind !== SyntaxKind.Identifier
				) {
					continue;
				}

				const propName = property.name.text;

				if (seenProps.has(propName)) {
					context.report({
						data: { propName },
						message: "duplicateProp",
						range: getTSNodeRange(property.name, sourceFile),
					});
				} else {
					seenProps.add(propName);
				}
			}
		}

		return {
			visitors: {
				JsxOpeningElement: checkElement,
				JsxSelfClosingElement: checkElement,
			},
		};
	},
});
