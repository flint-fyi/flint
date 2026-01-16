import {
	type AST,
	isGlobalDeclarationOfName,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

const literalConstructors = new Set(["BigInt", "Boolean", "Number", "String"]);

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Prefers literal syntax over constructor function calls for primitive values.",
		id: "literalConstructorWrappers",
		presets: ["stylistic"],
	},
	messages: {
		preferLiteral: {
			primary:
				"Prefer literal syntax over {{ name }}() for creating primitive values.",
			secondary: [
				"Literal syntax like `123n` for BigInt or `!!value` for Boolean is more concise and idiomatic.",
				"Constructor calls can be replaced with operators or template literals.",
			],
			suggestions: [
				"Use literal syntax instead of {{ name }}().",
				"For example: `123n` instead of `BigInt(123)`, `!!value` instead of `Boolean(value)`.",
			],
		},
	},
	setup(context) {
		function checkNode(
			node: AST.CallExpression,
			{ sourceFile, typeChecker }: TypeScriptFileServices,
		) {
			if (!ts.isIdentifier(node.expression)) {
				return;
			}

			const name = node.expression.text;
			if (!literalConstructors.has(name)) {
				return;
			}

			if (!isGlobalDeclarationOfName(node.expression, name, typeChecker)) {
				return;
			}

			if (node.arguments.length !== 1) {
				return;
			}

			const argument = node.arguments[0];
			if (!argument) {
				return;
			}

			if (!isLiteralArgument(argument, name)) {
				return;
			}

			context.report({
				data: { name },
				message: "preferLiteral",
				range: {
					begin: node.getStart(sourceFile),
					end: node.expression.getEnd(),
				},
			});
		}

		function isLiteralArgument(node: AST.Expression, constructorName: string) {
			switch (constructorName) {
				case "BigInt": {
					return isNumericLiteralForBigInt(node);
				}

				case "Boolean": {
					return ts.isLiteralExpression(node) || isBooleanLiteral(node);
				}

				case "Number": {
					return ts.isStringLiteral(node) && isValidNumericString(node.text);
				}

				case "String": {
					return (
						ts.isNumericLiteral(node) ||
						isBooleanLiteral(node) ||
						ts.isBigIntLiteral(node)
					);
				}

				default: {
					return false;
				}
			}
		}

		function isBooleanLiteral(node: AST.Expression) {
			return (
				node.kind === ts.SyntaxKind.TrueKeyword ||
				node.kind === ts.SyntaxKind.FalseKeyword
			);
		}

		function isNumericLiteralForBigInt(node: AST.Expression) {
			if (!ts.isNumericLiteral(node)) {
				return false;
			}

			const value = node.text;
			return /^-?\d+$/.test(value);
		}

		function isValidNumericString(value: string) {
			const trimmed = value.trim();
			if (trimmed === "") {
				return false;
			}

			const number = Number(trimmed);
			return !Number.isNaN(number) && Number.isFinite(number);
		}

		return {
			visitors: {
				CallExpression: (node, services) => {
					checkNode(node, services);
				},
			},
		};
	},
});
