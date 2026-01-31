import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function isConstAssertion(node: AST.TypeAssertion, sourceFile: AST.SourceFile) {
	return (
		node.type.kind === ts.SyntaxKind.TypeReference &&
		node.type.typeName.kind === ts.SyntaxKind.Identifier &&
		node.type.typeName.getText(sourceFile) === "const"
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports angle-bracket type assertions.",
		id: "typeAssertionStyles",
		presets: ["stylistic"],
	},
	messages: {
		preferAs: {
			primary:
				"Prefer `as` syntax for type assertions instead of legacy angle-brackets.",
			secondary: [
				"Angle-bracket syntax is ambiguous with JSX.",
				"The 'as' syntax is clearer and works in all contexts.",
			],
			suggestions: ["Convert '<Type>value' to 'value as Type'."],
		},
	},
	setup(context) {
		return {
			visitors: {
				TypeAssertionExpression(node, { sourceFile }) {
					if (isConstAssertion(node, sourceFile)) {
						return;
					}

					context.report({
						message: "preferAs",
						range: getTSNodeRange(node, sourceFile),
					});
				},
			},
		};
	},
});
