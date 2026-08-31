import { createScanner, SyntaxKind } from "typescript-native/unstable/ast";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { isArrayOrTupleTypeAtLocation } from "./utils/isArrayOrTupleTypeAtLocation.ts";

function buildSpliceReplacement(
	node: AST.DeleteExpression,
	elementAccess: AST.ElementAccessExpression,
	sourceFile: AST.SourceFile,
): string {
	const openingScanner = createScanner(
		true,
		sourceFile.languageVariant,
		sourceFile.text,
		elementAccess.expression.getEnd(),
	);
	let tokenKind: SyntaxKind;
	do {
		tokenKind = openingScanner.scan();
	} while (
		tokenKind !== SyntaxKind.OpenBracketToken &&
		tokenKind !== SyntaxKind.EndOfFileToken
	);
	const openBracket =
		tokenKind === SyntaxKind.OpenBracketToken
			? openingScanner.getTokenStart()
			: elementAccess.expression.getEnd();

	const closingScanner = createScanner(
		true,
		sourceFile.languageVariant,
		sourceFile.text,
		elementAccess.argumentExpression.getEnd(),
	);
	do {
		tokenKind = closingScanner.scan();
	} while (
		tokenKind !== SyntaxKind.CloseBracketToken &&
		tokenKind !== SyntaxKind.EndOfFileToken
	);
	const closeBracket =
		tokenKind === SyntaxKind.CloseBracketToken
			? closingScanner.getTokenStart()
			: elementAccess.argumentExpression.getEnd();

	const before = sourceFile.text.slice(
		node.getStart(sourceFile) + "delete".length,
		openBracket,
	);

	const keyText = sourceFile.text.slice(openBracket + 1, closeBracket);

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
				DeleteExpression: (node, { checker, sourceFile }) => {
					if (
						node.expression.kind !== SyntaxKind.ElementAccessExpression ||
						!isArrayOrTupleTypeAtLocation(node.expression.expression, checker)
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
