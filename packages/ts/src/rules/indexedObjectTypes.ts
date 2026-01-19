import {
	type AST,
	getTSNodeRange,
	isGlobalDeclaration,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as ts from "typescript";
import { z } from "zod";

import { ruleCreator } from "./ruleCreator.ts";

function getSingleIndexSignature(members: ts.NodeArray<AST.TypeElement>) {
	if (members.length !== 1) {
		return undefined;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const member = members[0]!;
	if (member.kind !== ts.SyntaxKind.IndexSignature) {
		return undefined;
	}

	return member;
}

function getTypeName(node: AST.InterfaceDeclaration | AST.TypeLiteralNode) {
	if (node.kind === ts.SyntaxKind.InterfaceDeclaration) {
		return node.name.text;
	}

	let current = node.parent as ts.Node | undefined;
	while (current) {
		if (ts.isTypeAliasDeclaration(current)) {
			return current.name.text;
		}
		current = current.parent;
	}
	return undefined;
}

function isDirectlyRecursive(
	node: AST.AnyNode,
	parentTypeName: string,
): boolean {
	switch (node.kind) {
		case ts.SyntaxKind.ConditionalType:
			return (
				isDirectlyRecursive(node.checkType, parentTypeName) ||
				isDirectlyRecursive(node.extendsType, parentTypeName) ||
				isDirectlyRecursive(node.trueType, parentTypeName) ||
				isDirectlyRecursive(node.falseType, parentTypeName)
			);

		case ts.SyntaxKind.IndexedAccessType:
			return (
				isDirectlyRecursive(node.objectType, parentTypeName) ||
				isDirectlyRecursive(node.indexType, parentTypeName)
			);

		case ts.SyntaxKind.IntersectionType:
		case ts.SyntaxKind.UnionType:
			return node.types.some((type) =>
				isDirectlyRecursive(type, parentTypeName),
			);
		case ts.SyntaxKind.ParenthesizedType:
			return isDirectlyRecursive(node.type, parentTypeName);

		case ts.SyntaxKind.TypeReference:
			if (
				node.typeName.kind === ts.SyntaxKind.Identifier &&
				node.typeName.text === parentTypeName
			) {
				return true;
			}
			if (node.typeArguments) {
				return node.typeArguments.some((arg) =>
					isDirectlyRecursive(arg, parentTypeName),
				);
			}
			return false;

		default:
			return false;
	}
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports indexed object types that don't match the configured style.",
		id: "indexedObjectTypes",
		presets: ["stylistic"],
	},
	messages: {
		preferIndexSignature: {
			primary: "Prefer an index signature over `Record<K, V>`.",
			secondary: [
				"TypeScript provides two equivalent ways to define indexed object types: `Record<K, V>` and `{ [key: K]: V }`.",
				"Using index signatures consistently matches the more traditional TypeScript syntax.",
			],
			suggestions: ["Replace `Record<K, V>` with `{ [key: K]: V }`."],
		},
		preferRecord: {
			primary: "Prefer `Record<K, V>` over an index signature.",
			secondary: [
				"TypeScript provides two equivalent ways to define indexed object types: `Record<K, V>` and `{ [key: K]: V }`.",
				"Using `Record<K, V>` consistently is more concise and idiomatic.",
			],
			suggestions: ["Replace the index signature with `Record<K, V>`."],
		},
	},
	options: {
		style: z
			.enum(["index-signature", "record"])
			.default("record")
			.describe(
				"Which indexed object type syntax to enforce: 'record' for `Record<K, V>`, or 'index-signature' for `{ [key: K]: V }`.",
			),
	},
	setup(context) {
		function checkForRecord(
			node: AST.InterfaceDeclaration | AST.TypeLiteralNode,
			members: ts.NodeArray<AST.TypeElement>,
			sourceFile: AST.SourceFile,
		) {
			const member = getSingleIndexSignature(members);
			if (!member?.type) {
				return;
			}

			const typeName = getTypeName(node);
			if (typeName && isDirectlyRecursive(member.type, typeName)) {
				return;
			}

			context.report({
				message: "preferRecord",
				range: getTSNodeRange(node, sourceFile),
			});
		}

		return {
			visitors: {
				InterfaceDeclaration: (node, { options, sourceFile }) => {
					if (options.style === "record" && !node.heritageClauses?.length) {
						checkForRecord(node, node.members, sourceFile);
					}
				},
				TypeLiteral: (node, { options, sourceFile }) => {
					if (options.style === "record") {
						checkForRecord(node, node.members, sourceFile);
					}
				},
				TypeReference: (node, { options, sourceFile, typeChecker }) => {
					if (
						options.style === "index-signature" &&
						node.typeName.kind === ts.SyntaxKind.Identifier &&
						node.typeName.text === "Record" &&
						isGlobalDeclaration(node.typeName, typeChecker) &&
						node.typeArguments?.length === 2
					) {
						context.report({
							message: "preferIndexSignature",
							range: getTSNodeRange(node, sourceFile),
						});
					}
				},
			},
		};
	},
});
