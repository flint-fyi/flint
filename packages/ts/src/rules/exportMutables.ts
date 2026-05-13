import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import { SyntaxKind } from "typescript";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function isMutableDeclaration(node: AST.VariableDeclarationList): boolean {
	return (
		(node.flags & ts.NodeFlags.Let) !== 0 ||
		(node.flags & ts.NodeFlags.Const) === 0
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports exporting mutable bindings (let or var).",
		id: "exportMutables",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		noMutableExport: {
			primary: "Exported variable '{{ name }}' is mutable. Use const instead.",
			secondary: [
				"Mutable exports can lead to confusing behavior when the value is changed after import.",
				"Consumers of the module may not expect the exported value to change.",
			],
			suggestions: [
				"Use const to declare the exported variable.",
				"If mutation is necessary, export a getter function instead.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				VariableStatement: (node, { sourceFile }) => {
					if (
						!isMutableDeclaration(node.declarationList) ||
						!node.modifiers?.some(
							(modifier) => modifier.kind === SyntaxKind.ExportKeyword,
						)
					) {
						return;
					}

					for (const declaration of node.declarationList.declarations) {
						context.report({
							data: {
								name:
									declaration.name.kind === SyntaxKind.Identifier
										? declaration.name.text
										: declaration.name.getText(sourceFile),
							},
							message: "noMutableExport",
							range: getTSNodeRange(declaration.name, sourceFile),
						});
					}
				},
			},
		};
	},
});
