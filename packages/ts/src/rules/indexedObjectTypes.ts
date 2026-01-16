import {
	type AST,
	getTSNodeRange,
	isGlobalDeclaration,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as ts from "typescript";
import { z } from "zod";

import { ruleCreator } from "./ruleCreator.ts";

function getSingleIndexSignature(
	members: ts.NodeArray<ts.TypeElement>,
): ts.IndexSignatureDeclaration | undefined {
	if (members.length !== 1) {
		return undefined;
	}

	const member = members[0];
	if (!member || member.kind !== ts.SyntaxKind.IndexSignature) {
		return undefined;
	}

	return member as ts.IndexSignatureDeclaration;
}

function getTypeName(
	node: AST.InterfaceDeclaration | AST.TypeLiteralNode,
): string | undefined {
	if (node.kind === ts.SyntaxKind.InterfaceDeclaration) {
		return (node as ts.InterfaceDeclaration).name.text;
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

function hasValidIndexSignatureParameter(member: ts.IndexSignatureDeclaration) {
	const parameter = member.parameters[0];
	return (
		parameter !== undefined &&
		parameter.name.kind === ts.SyntaxKind.Identifier &&
		parameter.type !== undefined
	);
}

function isRecursiveType(
	node: ts.Node,
	parentTypeName: string | undefined,
	visited: Set<ts.Node>,
): boolean {
	if (!parentTypeName) {
		return false;
	}

	if (visited.has(node)) {
		return false;
	}

	visited.add(node);

	switch (node.kind) {
		case ts.SyntaxKind.ArrayType:
			return isRecursiveType(
				(node as ts.ArrayTypeNode).elementType,
				parentTypeName,
				visited,
			);
		case ts.SyntaxKind.ConditionalType: {
			const conditional = node as ts.ConditionalTypeNode;
			return (
				isRecursiveType(conditional.checkType, parentTypeName, visited) ||
				isRecursiveType(conditional.extendsType, parentTypeName, visited) ||
				isRecursiveType(conditional.trueType, parentTypeName, visited) ||
				isRecursiveType(conditional.falseType, parentTypeName, visited)
			);
		}
		case ts.SyntaxKind.IndexedAccessType: {
			const indexed = node as ts.IndexedAccessTypeNode;
			return (
				isRecursiveType(indexed.objectType, parentTypeName, visited) ||
				isRecursiveType(indexed.indexType, parentTypeName, visited)
			);
		}
		case ts.SyntaxKind.IndexSignature:
			return isRecursiveType(
				(node as ts.IndexSignatureDeclaration).type,
				parentTypeName,
				visited,
			);
		case ts.SyntaxKind.IntersectionType:
		case ts.SyntaxKind.UnionType:
			return (node as ts.UnionOrIntersectionTypeNode).types.some((type) =>
				isRecursiveType(type, parentTypeName, visited),
			);
		case ts.SyntaxKind.MappedType: {
			const mapped = node as ts.MappedTypeNode;
			if (mapped.type) {
				return isRecursiveType(mapped.type, parentTypeName, visited);
			}
			return false;
		}
		case ts.SyntaxKind.ParenthesizedType:
			return isRecursiveType(
				(node as ts.ParenthesizedTypeNode).type,
				parentTypeName,
				visited,
			);
		case ts.SyntaxKind.TupleType:
			return (node as ts.TupleTypeNode).elements.some((element) =>
				isRecursiveType(element, parentTypeName, visited),
			);
		case ts.SyntaxKind.TypeLiteral:
			return (node as ts.TypeLiteralNode).members.some((member) =>
				isRecursiveType(member, parentTypeName, visited),
			);
		case ts.SyntaxKind.TypeReference: {
			const typeRef = node as ts.TypeReferenceNode;
			if (
				typeRef.typeName.kind === ts.SyntaxKind.Identifier &&
				typeRef.typeName.text === parentTypeName
			) {
				return true;
			}
			if (typeRef.typeArguments) {
				return typeRef.typeArguments.some((arg) =>
					isRecursiveType(arg, parentTypeName, visited),
				);
			}
			return false;
		}
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
			members: ts.NodeArray<ts.TypeElement>,
			sourceFile: AST.SourceFile,
		) {
			const member = getSingleIndexSignature(members);
			if (!member) {
				return;
			}

			if (!hasValidIndexSignatureParameter(member)) {
				return;
			}

			const typeName = getTypeName(node);
			if (isRecursiveType(member.type, typeName, new Set())) {
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
					if (options.style !== "record") {
						return;
					}

					if (node.heritageClauses?.length) {
						return;
					}

					checkForRecord(node, node.members, sourceFile);
				},
				TypeLiteral: (node, { options, sourceFile }) => {
					if (options.style !== "record") {
						return;
					}

					checkForRecord(node, node.members, sourceFile);
				},
				TypeReference: (node, { options, sourceFile, typeChecker }) => {
					if (options.style !== "index-signature") {
						return;
					}

					if (
						node.typeName.kind !== ts.SyntaxKind.Identifier ||
						node.typeName.text !== "Record" ||
						!isGlobalDeclaration(node.typeName, typeChecker)
					) {
						return;
					}

					if (node.typeArguments?.length !== 2) {
						return;
					}

					context.report({
						message: "preferIndexSignature",
						range: getTSNodeRange(node, sourceFile),
					});
				},
			},
		};
	},
});
