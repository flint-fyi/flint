import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

// TODO: This might get simpler when we have scope analysis.
// https://github.com/JoshuaKGoldberg/flint/issues/400
function getParentClassName(node: AST.AnyNode): string | undefined {
	switch (node.parent.kind) {
		case ts.SyntaxKind.ClassDeclaration:
		case ts.SyntaxKind.ClassExpression:
			return node.parent.name?.text;

		case ts.SyntaxKind.SourceFile:
			return undefined;

		default:
			return getParentClassName(node.parent as AST.AnyNode);
	}
}

// TODO: This might get simpler when we have scope analysis.
// https://github.com/JoshuaKGoldberg/flint/issues/400
function getParentInterface(
	node: AST.AnyNode,
): AST.InterfaceDeclaration | undefined {
	switch (node.parent.kind) {
		case ts.SyntaxKind.InterfaceDeclaration:
			return node.parent;

		case ts.SyntaxKind.SourceFile:
			return undefined;

		default:
			return getParentInterface(node.parent as AST.AnyNode);
	}
}

function getTypeReferenceName(
	node: AST.TypeNode | undefined,
): string | undefined {
	return node?.kind === ts.SyntaxKind.TypeReference &&
		node.typeName.kind === ts.SyntaxKind.Identifier
		? node.typeName.text
		: undefined;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports misleading constructor and `new` definitions in interfaces and classes.",
		id: "newDefinitions",
		presets: ["logical"],
	},
	messages: {
		classMethodNamedNew: {
			primary:
				"A class method named `new` that returns the class type is misleading.",
			secondary: [
				"This looks like a constructor definition, but classes use `constructor` instead of `new`.",
				"A method named `new` suggests instantiation, which is confusing in a class context.",
			],
			suggestions: [
				"Rename the method if it's not meant to be a constructor.",
				"Use `constructor` to define the class constructor.",
			],
		},
		interfaceConstructSignature: {
			primary:
				"An interface cannot be constructed directly; only classes can be instantiated.",
			secondary: [
				"A `new()` signature in an interface that returns the interface type is misleading.",
				"If you want to define a class, use `class` instead of `interface`.",
				"If you want to define a constructor function type, the return type should differ from the interface name.",
			],
			suggestions: [
				"Use a class declaration instead of an interface.",
				"Change the return type if this describes a constructor function.",
			],
		},
		interfaceMethodNamedConstructor: {
			primary:
				"Interfaces define `new()` signatures, not `constructor` methods.",
			secondary: [
				"A method named `constructor` in an interface is misleading because interfaces cannot be instantiated.",
				"The `constructor` keyword is used in classes, not interfaces.",
			],
			suggestions: [
				"Use `new()` to define a construct signature in the interface.",
				"Convert this to a class if you need a constructor.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				ConstructSignature: (node, { sourceFile }) => {
					const parentInterface = getParentInterface(node);
					if (!parentInterface?.name) {
						return;
					}

					const returnTypeName = getTypeReferenceName(node.type);
					if (returnTypeName !== parentInterface.name.text) {
						return;
					}

					context.report({
						message: "interfaceConstructSignature",
						range: getTSNodeRange(node, sourceFile),
					});
				},
				MethodDeclaration: (node, { sourceFile }) => {
					if (
						node.body ||
						(node.parent.kind !== ts.SyntaxKind.ClassDeclaration &&
							node.parent.kind !== ts.SyntaxKind.ClassExpression) ||
						node.name.kind !== ts.SyntaxKind.Identifier ||
						node.name.text !== "new"
					) {
						return;
					}

					const parentName = getParentClassName(node);
					if (!parentName) {
						return;
					}

					const returnTypeName = getTypeReferenceName(node.type);
					if (returnTypeName !== parentName) {
						return;
					}

					context.report({
						message: "classMethodNamedNew",
						range: getTSNodeRange(node, sourceFile),
					});
				},
				MethodSignature: (node, { sourceFile }) => {
					if (
						node.name.kind !== ts.SyntaxKind.Identifier ||
						node.name.text !== "constructor"
					) {
						return;
					}

					context.report({
						message: "interfaceMethodNamedConstructor",
						range: getTSNodeRange(node, sourceFile),
					});
				},
			},
		};
	},
});
