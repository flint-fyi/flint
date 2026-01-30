import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";
import { isArrayOrTupleTypeAtLocation } from "./utils/isArrayOrTupleTypeAtLocation.ts";

function buildSpliceReplacement(
	node: AST.DeleteExpression,
	elementAccess: AST.ElementAccessExpression,
	sourceFile: AST.SourceFile,
): string {
	const children = elementAccess.getChildren(sourceFile);
	const openBracket = children.find(
		(child) => child.kind === ts.SyntaxKind.OpenBracketToken,
	);
	const closeBracket = children.find(
		(child) => child.kind === ts.SyntaxKind.CloseBracketToken,
	);

	const before = sourceFile.text.slice(
		node.getStart(sourceFile) + "delete".length,
		openBracket?.getStart(sourceFile) ?? elementAccess.expression.getEnd(),
	);

	const keyText = sourceFile.text.slice(
		openBracket?.getEnd() ??
			elementAccess.argumentExpression.getStart(sourceFile),
		closeBracket?.getStart(sourceFile) ??
			elementAccess.argumentExpression.getEnd(),
	);

	return `${before}.splice(${keyText}, 1)`;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports using the `delete` operator on array values.",
		id: "arrayElementDeletions",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		noArrayDelete: {
			primary: "Avoid using the `delete` operator on arrays.",
			secondary: [
				"Using `delete` on an array element removes it but leaves an empty slot, which can lead to unexpected behavior.",
				"The array's `length` property is not affected, and the element becomes `undefined` with a hole in the array.",
			],
			suggestions: ["Use `Array#splice()` to remove elements."],
		},
	},
	setup(context) {
		return {
			visitors: {
				DeleteExpression: (node, { sourceFile, typeChecker }) => {
					if (
						!ts.isElementAccessExpression(node.expression) ||
						!isArrayOrTupleTypeAtLocation(
							node.expression.expression,
							typeChecker,
						)
					) {
						return;
					}

					const range = getTSNodeRange(node, sourceFile);
					const spliceText = buildSpliceReplacement(
						node,
						node.expression,
						sourceFile,
					);

					context.report({
						message: "noArrayDelete",
						range,
						suggestions: [
							{
								id: "useSplice",
								range,
								text: spliceText,
							},
						],
					});
				},
			},
		};
	},
});
