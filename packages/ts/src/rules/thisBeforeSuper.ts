import { type AST, typescriptLanguage } from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function findFirstSuperCall(node: ts.Node): ts.CallExpression | undefined {
	if (
		ts.isCallExpression(node) &&
		node.expression.kind === ts.SyntaxKind.SuperKeyword
	) {
		return node;
	}

	let result: ts.CallExpression | undefined;
	ts.forEachChild(node, (child) => {
		if (!result) {
			result = findFirstSuperCall(child);
		}
	});

	return result;
}

function findThisOrSuperBeforePosition(
	node: ts.Node,
	position: number,
	sourceFile: ts.SourceFile,
): ts.Node | undefined {
	if (node.getStart(sourceFile) >= position) {
		return undefined;
	}

	if (node.kind === ts.SyntaxKind.ThisKeyword) {
		return node;
	}

	if (
		node.kind === ts.SyntaxKind.SuperKeyword &&
		ts.isPropertyAccessExpression(node.parent)
	) {
		return node;
	}

	let result: ts.Node | undefined;
	ts.forEachChild(node, (child) => {
		if (!result) {
			result = findThisOrSuperBeforePosition(child, position, sourceFile);
		}
	});

	return result;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports using `this` or `super` before calling `super()` in derived class constructors.",
		id: "thisBeforeSuper",
		presets: ["logical"],
	},
	messages: {
		thisBeforeSuper: {
			primary:
				"`this` is not allowed before `super()` in derived class constructors.",
			secondary: [
				"Accessing `this` before calling `super()` throws a ReferenceError.",
				"The `super()` call must be the first statement that accesses the instance.",
			],
			suggestions: ["Move `super()` before any use of `this`."],
		},
		superBeforeSuper: {
			primary:
				"`super` property access is not allowed before `super()` in derived class constructors.",
			secondary: [
				"Accessing `super.property` before calling `super()` throws a ReferenceError.",
			],
			suggestions: ["Move `super()` before any use of `super.property`."],
		},
	},
	setup(context) {
		return {
			visitors: {
				Constructor(node: AST.ConstructorDeclaration, { sourceFile }) {
					const classDeclaration = node.parent;
					if (
						!ts.isClassDeclaration(classDeclaration) &&
						!ts.isClassExpression(classDeclaration)
					) {
						return;
					}

					if (!classDeclaration.heritageClauses) {
						return;
					}

					const hasExtends = classDeclaration.heritageClauses.some(
						(clause) => clause.token === ts.SyntaxKind.ExtendsKeyword,
					);

					if (!hasExtends) {
						return;
					}

					if (!node.body) {
						return;
					}

					const superCall = findFirstSuperCall(node.body);
					if (!superCall) {
						return;
					}

					const superCallStart = superCall.getStart(sourceFile);

					const invalidNode = findThisOrSuperBeforePosition(
						node.body,
						superCallStart,
						sourceFile,
					);

					if (invalidNode) {
						const isThis = invalidNode.kind === ts.SyntaxKind.ThisKeyword;
						context.report({
							message: isThis ? "thisBeforeSuper" : "superBeforeSuper",
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
