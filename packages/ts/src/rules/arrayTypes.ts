import {
	type AST,
	getTSNodeRange,
	isGlobalDeclaration,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as ts from "typescript";
import { z } from "zod";

import { ruleCreator } from "./ruleCreator.ts";

function isSimpleType(typeNode: AST.TypeNode | undefined): boolean {
	switch (typeNode?.kind) {
		case ts.SyntaxKind.AnyKeyword:
		case ts.SyntaxKind.BigIntKeyword:
		case ts.SyntaxKind.BooleanKeyword:
		case ts.SyntaxKind.NeverKeyword:
		case ts.SyntaxKind.NumberKeyword:
		case ts.SyntaxKind.ObjectKeyword:
		case ts.SyntaxKind.StringKeyword:
		case ts.SyntaxKind.SymbolKeyword:
		case ts.SyntaxKind.TypeReference:
		case ts.SyntaxKind.UndefinedKeyword:
		case ts.SyntaxKind.UnknownKeyword:
		case ts.SyntaxKind.VoidKeyword:
			return true;
		case ts.SyntaxKind.ArrayType:
			return isSimpleType(typeNode.elementType);
		default:
			return false;
	}
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports array type syntax that doesn't match the configured style.",
		id: "arrayTypes",
		presets: ["stylistic"],
	},
	messages: {
		preferArraySyntax: {
			primary: "Prefer `T[]` over `Array<T>`.",
			secondary: [
				"TypeScript provides two equivalent ways to define an array type: `T[]` and `Array<T>`.",
				"Using the shorthand `T[]` syntax consistently is more concise and idiomatic.",
			],
			suggestions: ["Replace `Array<T>` with `T[]`."],
		},
		preferGenericSyntax: {
			primary: "Prefer `Array<T>` over `T[]`.",
			secondary: [
				"TypeScript provides two equivalent ways to define an array type: `T[]` and `Array<T>`.",
				"Using the generic `Array<T>` syntax consistently can be clearer for complex types.",
			],
			suggestions: ["Replace `T[]` with `Array<T>`."],
		},
		preferReadonlyArraySyntax: {
			primary: "Prefer `readonly T[]` over `ReadonlyArray<T>`.",
			secondary: [
				"TypeScript provides two equivalent ways to define a readonly array type: `readonly T[]` and `ReadonlyArray<T>`.",
				"Using the shorthand `readonly T[]` syntax consistently is more concise and idiomatic.",
			],
			suggestions: ["Replace `ReadonlyArray<T>` with `readonly T[]`."],
		},
		preferReadonlyGenericSyntax: {
			primary: "Prefer `ReadonlyArray<T>` over `readonly T[]`.",
			secondary: [
				"TypeScript provides two equivalent ways to define a readonly array type: `readonly T[]` and `ReadonlyArray<T>`.",
				"Using the generic `ReadonlyArray<T>` syntax consistently can be clearer for complex types.",
			],
			suggestions: ["Replace `readonly T[]` with `ReadonlyArray<T>`."],
		},
	},
	options: {
		style: z
			.enum(["array", "array-simple", "generic"])
			.default("array")
			.describe(
				"Which array type syntax to enforce: 'array' for `T[]`, 'generic' for `Array<T>`, or 'array-simple' for `T[]` only with simple types.",
			),
	},
	setup(context) {
		return {
			visitors: {
				ArrayType: (node, { options, sourceFile }) => {
					if (
						node.parent.kind === ts.SyntaxKind.TypeOperator &&
						node.parent.operator === ts.SyntaxKind.ReadonlyKeyword
					) {
						return;
					}

					switch (options.style) {
						case "array":
							return;
						case "array-simple":
							if (isSimpleType(node.elementType)) {
								return;
							}
							break;
						case "generic":
							break;
					}

					context.report({
						message: "preferGenericSyntax",
						range: getTSNodeRange(node, sourceFile),
					});
				},
				TypeOperator: (node, { options, sourceFile }) => {
					if (
						node.operator !== ts.SyntaxKind.ReadonlyKeyword ||
						node.type.kind !== ts.SyntaxKind.ArrayType
					) {
						return;
					}

					const arrayType = node.type;

					switch (options.style) {
						case "array":
							return;
						case "array-simple":
							if (isSimpleType(arrayType.elementType)) {
								return;
							}
							break;
						case "generic":
							break;
					}

					context.report({
						message: "preferReadonlyGenericSyntax",
						range: getTSNodeRange(node, sourceFile),
					});
				},
				TypeReference: (node, { options, sourceFile, typeChecker }) => {
					if (
						node.typeName.kind !== ts.SyntaxKind.Identifier ||
						!isGlobalDeclaration(node.typeName, typeChecker)
					) {
						return;
					}

					const typeName = node.typeName.text;
					if (typeName !== "Array" && typeName !== "ReadonlyArray") {
						return;
					}

					const typeArg = node.typeArguments?.[0];

					switch (options.style) {
						case "array":
							break;
						case "array-simple":
							if (!isSimpleType(typeArg)) {
								return;
							}
							break;
						case "generic":
							return;
					}

					context.report({
						message:
							typeName === "Array"
								? "preferArraySyntax"
								: "preferReadonlyArraySyntax",
						range: getTSNodeRange(node, sourceFile),
					});
				},
			},
		};
	},
});
