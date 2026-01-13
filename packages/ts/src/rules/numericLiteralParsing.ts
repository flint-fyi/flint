import { nullThrows } from "@flint.fyi/utils";
import ts, { SyntaxKind } from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";
import * as AST from "../types/ast.ts";
import { isGlobalDeclaration } from "../utils/isGlobalDeclaration.ts";

function convertToLiteral(value: string, radix: number): string {
	const parsed = Number.parseInt(value, radix);
	if (Number.isNaN(parsed)) {
		return value;
	}

	switch (radix) {
		case 2:
			return `0b${parsed.toString(2)}`;
		case 8:
			return `0o${parsed.toString(8)}`;
		case 16:
			return `0x${parsed.toString(16).toUpperCase()}`;
		default:
			return value;
	}
}

function getRadixValue(node: AST.Expression): number | undefined {
	if (node.kind !== SyntaxKind.NumericLiteral) {
		return undefined;
	}

	const value = Number(node.text);
	if (![2, 8, 16].includes(value)) {
		return undefined;
	}

	return value;
}

// TODO: Use a util like getStaticValue
// https://github.com/flint-fyi/flint/issues/1298
function getStringValue(node: AST.Expression): string | undefined {
	return node.kind === SyntaxKind.StringLiteral ||
		node.kind === SyntaxKind.NoSubstitutionTemplateLiteral
		? node.text
		: undefined;
}

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports parseInt calls with binary, hexadecimal, or octal strings that can be replaced with numeric literals.",
		id: "numericLiteralParsing",
		preset: "stylistic",
	},
	messages: {
		preferLiteral: {
			primary: "Use {{ literal }} instead of parseInt with radix {{ radix }}.",
			secondary: [
				"Binary, octal, and hexadecimal numeric literals are more readable and direct than using parseInt with a radix.",
				"Numeric literals are supported natively and don't require function calls.",
			],
			suggestions: ["Replace the parseInt call with the numeric literal."],
		},
	},
	setup(context) {
		function checkParseIntCall(
			node: AST.CallExpression,
			sourceFile: ts.SourceFile,
		) {
			if (node.arguments.length !== 2) {
				return;
			}

			const stringValue = getStringValue(
				nullThrows(
					node.arguments[0],
					"First argument is expected to be present by prior length check",
				),
			);
			if (!stringValue) {
				return;
			}

			const radixValue = getRadixValue(
				nullThrows(
					node.arguments[1],
					"Second argument is expected to be present by prior length check",
				),
			);
			if (!radixValue) {
				return;
			}

			context.report({
				data: {
					literal: convertToLiteral(stringValue, radixValue),
					radix: String(radixValue),
				},
				message: "preferLiteral",
				range: getTSNodeRange(node, sourceFile),
			});
		}

		return {
			visitors: {
				CallExpression: (node, { sourceFile, typeChecker }) => {
					if (node.expression.kind === SyntaxKind.Identifier) {
						if (
							node.expression.text === "parseInt" &&
							isGlobalDeclaration(node.expression, typeChecker)
						) {
							checkParseIntCall(node, sourceFile);
						}
					} else if (
						node.expression.kind === SyntaxKind.PropertyAccessExpression
					) {
						if (
							node.expression.expression.kind === SyntaxKind.Identifier &&
							node.expression.expression.text === "Number" &&
							node.expression.name.kind === SyntaxKind.Identifier &&
							node.expression.name.text === "parseInt" &&
							isGlobalDeclaration(node.expression.expression, typeChecker)
						) {
							checkParseIntCall(node, sourceFile);
						}
					}
				},
			},
		};
	},
});
