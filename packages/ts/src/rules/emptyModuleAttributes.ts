import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";
import * as AST from "../types/ast.ts";
import { ruleCreator } from "./ruleCreator.ts";

function isEmptyAttributes(attributes: AST.ImportAttributes | undefined) {
	if (!attributes) {
		return false;
	}

	return attributes.elements.length === 0;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports empty import/export attributes that serve no purpose.",
		id: "emptyModuleAttributes",
		presets: ["stylistic"],
	},
	messages: {
		emptyAttributes: {
			primary:
				"Empty import attributes serve no purpose and should be removed.",
			secondary: [
				"An empty `with {}` or `assert {}` clause provides no additional information about the import.",
				"Remove the empty attributes clause or add the intended attributes.",
			],
			suggestions: ["Remove the empty attributes clause."],
		},
	},
	setup(context) {
		function checkAttributes(
			attributes: AST.ImportAttributes | undefined,
			sourceFile: AST.SourceFile,
		) {
			if (!isEmptyAttributes(attributes) || !attributes) {
				return;
			}

			context.report({
				fix: {
					range: {
						begin: attributes.getStart(sourceFile),
						end: attributes.getEnd(),
					},
					text: "",
				},
				message: "emptyAttributes",
				range: getTSNodeRange(attributes, sourceFile),
			});
		}

		return {
			visitors: {
				ExportDeclaration: (node, { sourceFile }) => {
					checkAttributes(node.attributes, sourceFile);
				},
				ImportDeclaration: (node, { sourceFile }) => {
					checkAttributes(node.attributes, sourceFile);
				},
			},
		};
	},
});
