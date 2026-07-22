import { SyntaxKind } from "typescript";

import {
	forEachChild,
	typescriptLanguage,
	type AST,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

function findAllThisOrSuper(
	node: AST.AnyNode,
	sourceFile: AST.SourceFile,
	results: AST.AnyNode[],
): void {
	if (isNestedScope(node)) {
		return;
	}

	if (node.kind === SyntaxKind.ThisKeyword) {
		results.push(node);
		return;
	}

	if (
		node.kind === SyntaxKind.SuperKeyword &&
		node.parent.kind === SyntaxKind.PropertyAccessExpression
	) {
		results.push(node);
		return;
	}

	forEachChild(node, (child) => {
		findAllThisOrSuper(child, sourceFile, results);
	});
}

function findAllThisOrSuperBeforePosition(
	node: AST.AnyNode,
	position: number,
	sourceFile: AST.SourceFile,
	results: AST.AnyNode[],
): void {
	if (node.getStart(sourceFile) >= position) {
		return;
	}

	if (isNestedScope(node)) {
		return;
	}

	if (node.kind === SyntaxKind.ThisKeyword) {
		results.push(node);
		return;
	}

	if (
		node.kind === SyntaxKind.SuperKeyword &&
		node.parent.kind === SyntaxKind.PropertyAccessExpression
	) {
		results.push(node);
		return;
	}

	forEachChild(node, (child) => {
		findAllThisOrSuperBeforePosition(child, position, sourceFile, results);
	});
}

function findFirstSuperCall(node: AST.AnyNode): AST.CallExpression | undefined {
	if (isNestedScope(node)) {
		return undefined;
	}

	if (
		node.kind === SyntaxKind.CallExpression &&
		node.expression.kind === SyntaxKind.SuperKeyword
	) {
		return node;
	}

	return forEachChild(node, (child) => {
		return findFirstSuperCall(child);
	});
}

// TODO: This will be more clean when there is a scope manager
// https://github.com/flint-fyi/flint/issues/400
function isNestedScope(node: AST.AnyNode) {
	return (
		node.kind === SyntaxKind.FunctionDeclaration ||
		node.kind === SyntaxKind.FunctionExpression ||
		node.kind === SyntaxKind.ArrowFunction ||
		node.kind === SyntaxKind.ClassDeclaration ||
		node.kind === SyntaxKind.ClassExpression
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports using `this` or `super` before calling `super()` in derived class constructors.",
		id: "thisBeforeSuper",
		presets: ["javascript"],
	},
	messages: {
		superBeforeSuper: {
			primary:
				"`super` property access is not allowed before `super()` in derived class constructors.",
			secondary: [
				"Accessing `super.property` before calling `super()` throws a ReferenceError.",
			],
			suggestions: ["Move `super()` before any use of `super.property`."],
		},
		thisBeforeSuper: {
			primary:
				"`this` is not allowed before `super()` in derived class constructors.",
			secondary: [
				"Accessing `this` before calling `super()` throws a ReferenceError.",
				"The `super()` call must be the first statement that accesses the instance.",
			],
			suggestions: ["Move `super()` before any use of `this`."],
		},
	},
	setup(context) {
		return {
			visitors: {
				Constructor(node: AST.ConstructorDeclaration, { sourceFile }) {
					if (!node.parent.heritageClauses) {
						return;
					}

					const hasExtends = node.parent.heritageClauses.some(
						(clause) => clause.token === SyntaxKind.ExtendsKeyword,
					);

					if (!hasExtends || !node.body) {
						return;
					}

					const superCall = findFirstSuperCall(node.body);

					const invalidNodes: AST.AnyNode[] = [];

					if (superCall) {
						const superCallStart = superCall.getStart(sourceFile);
						findAllThisOrSuperBeforePosition(
							node.body,
							superCallStart,
							sourceFile,
							invalidNodes,
						);
						for (const arg of superCall.arguments) {
							findAllThisOrSuper(arg, sourceFile, invalidNodes);
						}
					} else {
						findAllThisOrSuper(node.body, sourceFile, invalidNodes);
					}

					for (const invalidNode of invalidNodes) {
						context.report({
							message:
								invalidNode.kind === SyntaxKind.ThisKeyword
									? "thisBeforeSuper"
									: "superBeforeSuper",
							range: {
								begin: invalidNode.getStart(sourceFile),
								end: invalidNode.getEnd(),
							},
						});
					}
				},
			},
		};
	},
});
