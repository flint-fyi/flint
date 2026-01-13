import * as ts from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import type { AST, TypeScriptFileServices } from "../index.ts";
import { typescriptLanguage } from "../language.ts";
import { isGlobalDeclarationOfName } from "../utils/isGlobalDeclarationOfName.ts";

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports using the `Array` constructor to create arrays instead of array literal syntax.",
		id: "arrayConstructors",
		preset: "logical",
	},
	messages: {
		preferLiteral: {
			primary: "Prefer array literal syntax over the `Array` constructor.",
			secondary: [
				"The `Array` constructor has confusing behavior with a single numeric argument, creating a sparse array instead of an array containing that number.",
				"Array literal syntax is clearer and avoids potential pitfalls.",
			],
			suggestions: ["Use array literal syntax like `[]` or `[1, 2, 3]`."],
		},
	},
	setup(context) {
		function checkNode(
			node: AST.CallExpression | AST.NewExpression,
			{ sourceFile, typeChecker }: TypeScriptFileServices,
		) {
			if (
				!ts.isIdentifier(node.expression) ||
				node.expression.text !== "Array" ||
				shouldAllowCallOrNew(node) ||
				!isGlobalDeclarationOfName(node.expression, "Array", typeChecker)
			) {
				return;
			}

			const argumentsText = node.arguments
				?.map((arg) => arg.getText(sourceFile))
				.join(", ");
			const range = getTSNodeRange(node, sourceFile);

			context.report({
				fix: {
					range,
					text: `[${argumentsText}]`,
				},
				message: "preferLiteral",
				range,
			});
		}

		return {
			visitors: {
				CallExpression: checkNode,
				NewExpression: checkNode,
			},
		};
	},
});

function getSoleArgument(node: AST.CallExpression | AST.NewExpression) {
	return node.arguments?.length === 1
		? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			node.arguments[0]!
		: undefined;
}

function shouldAllowCallOrNew(node: AST.CallExpression | AST.NewExpression) {
	if (node.typeArguments && node.typeArguments.length > 0) {
		return true;
	}

	const soleArgument = getSoleArgument(node);
	return !!soleArgument && ts.isNumericLiteral(soleArgument);
}
