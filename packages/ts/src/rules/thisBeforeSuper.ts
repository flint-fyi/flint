import { type AST, typescriptLanguage } from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function findAllThisOrSuper(
	node: ts.Node,
	sourceFile: ts.SourceFile,
	results: ts.Node[],
): void {
	if (isNestedScope(node)) {
		return;
	}

	if (node.kind === ts.SyntaxKind.ThisKeyword) {
		results.push(node);
		return;
	}

	if (
		node.kind === ts.SyntaxKind.SuperKeyword &&
		ts.isPropertyAccessExpression(node.parent)
	) {
		results.push(node);
		return;
	}

	ts.forEachChild(node, (child) => {
		findAllThisOrSuper(child, sourceFile, results);
	});
}

function findAllThisOrSuperBeforePosition(
	node: ts.Node,
	position: number,
	sourceFile: ts.SourceFile,
	results: ts.Node[],
): void {
	if (node.getStart(sourceFile) >= position) {
		return;
	}

	if (isNestedScope(node)) {
		return;
	}

	if (node.kind === ts.SyntaxKind.ThisKeyword) {
		results.push(node);
		return;
	}

	if (
		node.kind === ts.SyntaxKind.SuperKeyword &&
		ts.isPropertyAccessExpression(node.parent)
	) {
		results.push(node);
		return;
	}

	ts.forEachChild(node, (child) => {
		findAllThisOrSuperBeforePosition(child, position, sourceFile, results);
	});
}

function findFirstSuperCall(node: ts.Node): ts.CallExpression | undefined {
	if (isNestedScope(node)) {
		return undefined;
	}

	if (
		ts.isCallExpression(node) &&
		node.expression.kind === ts.SyntaxKind.SuperKeyword
	) {
		return node;
	}

	return ts.forEachChild(node, (child) => {
		return findFirstSuperCall(child);
	});
}

// TODO: This will be more clean when there is a scope manager
// https://github.com/flint-fyi/flint/issues/400
function isNestedScope(node: ts.Node) {
	return (
		ts.isFunctionDeclaration(node) ||
		ts.isFunctionExpression(node) ||
		ts.isArrowFunction(node) ||
		ts.isClassDeclaration(node) ||
		ts.isClassExpression(node)
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
						(clause) => clause.token === ts.SyntaxKind.ExtendsKeyword,
					);

					if (!hasExtends || !node.body) {
						return;
					}

					const superCall = findFirstSuperCall(node.body);

					const invalidNodes: ts.Node[] = [];

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
								invalidNode.kind === ts.SyntaxKind.ThisKeyword
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
