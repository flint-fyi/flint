import * as ts from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import type { AST } from "../index.ts";
import { typescriptLanguage } from "../language.ts";
import { getConstrainedTypeAtLocation } from "./utils/getConstrainedType.ts";
import { isTypeRecursive } from "./utils/isTypeRecursive.ts";

function buildSpliceReplacement(
	node: AST.DeleteExpression,
	elementAccess: AST.ElementAccessExpression,
	sourceFile: ts.SourceFile,
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

function isArrayOrTupleType(
	type: ts.Type,
	typeChecker: ts.TypeChecker,
): boolean {
	return isTypeRecursive(
		type,
		(t) => typeChecker.isArrayType(t) || typeChecker.isTupleType(t),
	);
}

export default typescriptLanguage.createRule({
	about: {
		description: "Reports using the `delete` operator on array values.",
		id: "arrayElementDeletions",
		preset: "logical",
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
					if (!ts.isElementAccessExpression(node.expression)) {
						return;
					}

					const objectType = getConstrainedTypeAtLocation(
						node.expression.expression,
						typeChecker,
					);

					if (!isArrayOrTupleType(objectType, typeChecker)) {
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
