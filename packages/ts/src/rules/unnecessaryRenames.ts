import type { CharacterReportRange } from "@flint.fyi/core";
import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
	unwrapParenthesizedNode,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";
import { countCommentsInRange } from "./utils/countCommentsInRange.ts";

// TODO: Use a util like getStaticValue
// https://github.com/flint-fyi/flint/issues/1298
function getModuleNameText(node: ts.Node | undefined) {
	if (!node) {
		return;
	}

	if (ts.isIdentifier(node) || ts.isStringLiteral(node)) {
		return node.text;
	}
}

function getPropertyAssignmentTargetInfo(node: AST.PropertyAssignment) {
	if (
		node.initializer.kind === ts.SyntaxKind.BinaryExpression &&
		node.initializer.operatorToken.kind === ts.SyntaxKind.EqualsToken
	) {
		const targetParent = node.initializer.left;
		return {
			parenthesizesTarget:
				targetParent.kind === ts.SyntaxKind.ParenthesizedExpression,
			replacementNode: node.initializer,
			targetNode: unwrapParenthesizedNode(targetParent),
		};
	}

	const targetNode = unwrapParenthesizedNode(node.initializer);

	return {
		parenthesizesTarget: false,
		replacementNode: targetNode,
		targetNode,
	};
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Renames that don't change the identifier name are unnecessary.",
		id: "unnecessaryRenames",
		presets: ["stylistic"],
	},
	messages: {
		unnecessaryRename: {
			primary: "Renaming to the same identifier name is unnecessary.",
			secondary: [
				"Using the same name for both the source and target is redundant.",
				"Remove the rename and use the shorthand syntax instead.",
			],
			suggestions: ["Remove the unnecessary rename."],
		},
	},
	setup(context) {
		function reportUnnecessaryRename(
			node: AST.AnyNode,
			parenthesizesTarget: boolean,
			replacementRange: CharacterReportRange,
			sourceFile: AST.SourceFile,
		) {
			const range = getTSNodeRange(node, sourceFile);
			const shouldSkipFix =
				parenthesizesTarget ||
				countCommentsInRange(sourceFile.text, range) >
					countCommentsInRange(sourceFile.text, replacementRange);

			context.report({
				fix: shouldSkipFix
					? undefined
					: {
							range,
							text: sourceFile.text.slice(
								replacementRange.begin,
								replacementRange.end,
							),
						},
				message: "unnecessaryRename",
				range,
			});
		}

		function checkExportOrImportSpecifier(
			original: AST.ExportSpecifier | AST.ImportSpecifier,
			rangeNode: AST.AnyNode,
			sourceFile: AST.SourceFile,
		) {
			if (
				getModuleNameText(original.propertyName) !==
				getModuleNameText(original.name)
			) {
				return;
			}

			const replacementRange = getTSNodeRange(rangeNode, sourceFile);

			reportUnnecessaryRename(original, false, replacementRange, sourceFile);
		}

		function checkObjectLiteralDestructuring(
			node: AST.ObjectLiteralExpression,
			sourceFile: AST.SourceFile,
		) {
			for (const property of node.properties) {
				if (
					!ts.isPropertyAssignment(property) ||
					property.name.kind === ts.SyntaxKind.ComputedPropertyName
				) {
					continue;
				}

				const { parenthesizesTarget, replacementNode, targetNode } =
					getPropertyAssignmentTargetInfo(property);

				if (ts.isObjectLiteralExpression(targetNode)) {
					checkObjectLiteralDestructuring(targetNode, sourceFile);
					continue;
				}

				if (targetNode.kind !== ts.SyntaxKind.Identifier) {
					continue;
				}

				const propertyNameText = getModuleNameText(property.name);
				if (propertyNameText !== targetNode.text) {
					continue;
				}

				reportUnnecessaryRename(
					property,
					parenthesizesTarget,
					getTSNodeRange(replacementNode, sourceFile),
					sourceFile,
				);
			}
		}

		return {
			visitors: {
				BinaryExpression: (node, { sourceFile }) => {
					if (node.operatorToken.kind !== ts.SyntaxKind.EqualsToken) {
						return;
					}

					const left = unwrapParenthesizedNode(node.left);
					if (left.kind !== ts.SyntaxKind.ObjectLiteralExpression) {
						return;
					}

					checkObjectLiteralDestructuring(left, sourceFile);
				},
				BindingElement: (node, { sourceFile }) => {
					if (
						node.propertyName?.kind !== ts.SyntaxKind.ComputedPropertyName &&
						node.name.kind === ts.SyntaxKind.Identifier &&
						getModuleNameText(node.propertyName) ===
							getModuleNameText(node.name)
					) {
						reportUnnecessaryRename(
							node,
							false,
							{
								begin: node.name.getStart(sourceFile),
								end: node.getEnd(),
							},
							sourceFile,
						);
					}
				},
				ExportSpecifier: (node, { sourceFile }) => {
					if (node.propertyName) {
						checkExportOrImportSpecifier(node, node.propertyName, sourceFile);
					}
				},
				ImportSpecifier: (node, { sourceFile }) => {
					checkExportOrImportSpecifier(node, node.name, sourceFile);
				},
			},
		};
	},
});
