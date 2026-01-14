import { SyntaxKind } from "typescript";
import ts from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";
import type * as AST from "../types/ast.ts";
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
		presets: ["logical"],
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
					const hasExportModifier = node.modifiers?.some(
						(mod) => mod.kind === SyntaxKind.ExportKeyword,
					);

					if (!hasExportModifier) {
						return;
					}

					if (!isMutableDeclaration(node.declarationList)) {
						return;
					}

					for (const declaration of node.declarationList.declarations) {
						const name =
							declaration.name.kind === SyntaxKind.Identifier
								? declaration.name.text
								: declaration.name.getText(sourceFile);

						context.report({
							data: { name },
							message: "noMutableExport",
							range: getTSNodeRange(declaration.name, sourceFile),
						});
					}
				},
			},
		};
	},
});
