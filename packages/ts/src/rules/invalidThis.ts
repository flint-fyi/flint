import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as ts from "typescript";
import { z } from "zod";

import { ruleCreator } from "./ruleCreator.ts";

type FunctionLike =
	| AST.ArrowFunction
	| AST.FunctionDeclaration
	| AST.FunctionExpression
	| AST.GetAccessorDeclaration
	| AST.MethodDeclaration
	| AST.SetAccessorDeclaration;

function getAssignedVariableName(node: FunctionLike): string | undefined {
	const parent = node.parent;

	if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) {
		return parent.name.text;
	}

	if (ts.isPropertyAssignment(parent) && ts.isIdentifier(parent.name)) {
		return parent.name.text;
	}

	return undefined;
}

function getEnclosingFunction(
	node: AST.ThisExpression,
): FunctionLike | undefined {
	let current: ts.Node | undefined = node.parent;

	while (current) {
		switch (current.kind) {
			case ts.SyntaxKind.ArrowFunction:
			case ts.SyntaxKind.FunctionDeclaration:
			case ts.SyntaxKind.FunctionExpression:
			case ts.SyntaxKind.GetAccessor:
			case ts.SyntaxKind.MethodDeclaration:
			case ts.SyntaxKind.SetAccessor:
				return current as FunctionLike;
			case ts.SyntaxKind.ClassDeclaration:
			case ts.SyntaxKind.ClassExpression:
			case ts.SyntaxKind.ClassStaticBlockDeclaration:
				return undefined;
		}
		current = current.parent as ts.Node | undefined;
	}

	return undefined;
}

function getFunctionName(node: FunctionLike): string | undefined {
	if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node)) {
		return node.name?.text;
	}

	return undefined;
}

function isArrayMethodWithThisArg(node: FunctionLike): boolean {
	const parent = node.parent;

	if (!ts.isCallExpression(parent)) {
		return false;
	}

	const callee = parent.expression;
	if (!ts.isPropertyAccessExpression(callee)) {
		return false;
	}

	const arrayMethods = new Set([
		"every",
		"filter",
		"find",
		"findIndex",
		"findLast",
		"findLastIndex",
		"flatMap",
		"forEach",
		"map",
		"some",
	]);

	const methodName = callee.name.text;
	if (!arrayMethods.has(methodName)) {
		return false;
	}

	const callbackIndex = parent.arguments.findIndex((arg) => arg === node);
	if (callbackIndex === -1) {
		return false;
	}

	return parent.arguments.length > callbackIndex + 1;
}

function isBindCallApply(node: FunctionLike): boolean {
	let current: ts.Node = node;

	while (ts.isParenthesizedExpression(current.parent)) {
		current = current.parent;
	}

	const parent = current.parent;

	if (!ts.isPropertyAccessExpression(parent)) {
		return false;
	}

	const grandParent = parent.parent;
	if (!ts.isCallExpression(grandParent) || grandParent.expression !== parent) {
		return false;
	}

	const methodName = parent.name.text;
	return (
		methodName === "bind" || methodName === "call" || methodName === "apply"
	);
}

function isClassMember(node: FunctionLike): boolean {
	switch (node.kind) {
		case ts.SyntaxKind.GetAccessor:
		case ts.SyntaxKind.MethodDeclaration:
		case ts.SyntaxKind.SetAccessor:
			return (
				ts.isClassDeclaration(node.parent) || ts.isClassExpression(node.parent)
			);
		default:
			return false;
	}
}

function isClassPropertyInitializer(node: FunctionLike): boolean {
	const parent = node.parent;
	return (
		ts.isPropertyDeclaration(parent) &&
		parent.initializer === node &&
		(ts.isClassDeclaration(parent.parent) ||
			ts.isClassExpression(parent.parent))
	);
}

function isConstructor(node: FunctionLike, capIsConstructor: boolean): boolean {
	if (!capIsConstructor) {
		return false;
	}

	const functionName = getFunctionName(node);
	if (functionName && /^[A-Z]/.test(functionName)) {
		return true;
	}

	const assignedName = getAssignedVariableName(node);
	if (assignedName && /^[A-Z]/.test(assignedName)) {
		return true;
	}

	return false;
}

function isInClassFieldInitializer(node: AST.ThisExpression): boolean {
	let current: ts.Node | undefined = node.parent;

	while (current) {
		if (ts.isPropertyDeclaration(current)) {
			return (
				ts.isClassDeclaration(current.parent) ||
				ts.isClassExpression(current.parent)
			);
		}

		if (
			ts.isFunctionDeclaration(current) ||
			ts.isFunctionExpression(current) ||
			ts.isClassStaticBlockDeclaration(current)
		) {
			return false;
		}

		current = current.parent as ts.Node | undefined;
	}

	return false;
}

function isInClassStaticBlock(node: AST.ThisExpression): boolean {
	let current: ts.Node | undefined = node.parent;

	while (current) {
		if (ts.isClassStaticBlockDeclaration(current)) {
			return true;
		}

		if (
			ts.isFunctionDeclaration(current) ||
			ts.isFunctionExpression(current) ||
			ts.isArrowFunction(current)
		) {
			return false;
		}

		current = current.parent as ts.Node | undefined;
	}

	return false;
}

function isObjectMethod(node: FunctionLike): boolean {
	const parent = node.parent;

	if (
		ts.isPropertyAssignment(parent) &&
		ts.isObjectLiteralExpression(parent.parent)
	) {
		return true;
	}

	if (
		(node.kind === ts.SyntaxKind.MethodDeclaration ||
			node.kind === ts.SyntaxKind.GetAccessor ||
			node.kind === ts.SyntaxKind.SetAccessor) &&
		ts.isObjectLiteralExpression(node.parent)
	) {
		return true;
	}

	return false;
}

function isPropertyAssignment(node: FunctionLike): boolean {
	const parent = node.parent;

	if (
		ts.isBinaryExpression(parent) &&
		parent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
		parent.right === node
	) {
		const left = parent.left;
		return (
			ts.isPropertyAccessExpression(left) || ts.isElementAccessExpression(left)
		);
	}

	return false;
}

function isValidThisContext(
	thisNode: AST.ThisExpression,
	capIsConstructor: boolean,
): boolean {
	if (isInClassFieldInitializer(thisNode)) {
		return true;
	}

	if (isInClassStaticBlock(thisNode)) {
		return true;
	}

	const enclosingFunction = getEnclosingFunction(thisNode);

	if (!enclosingFunction) {
		return true;
	}

	if (enclosingFunction.kind === ts.SyntaxKind.ArrowFunction) {
		return isValidThisContextForArrow(enclosingFunction, capIsConstructor);
	}

	if (isClassMember(enclosingFunction)) {
		return true;
	}

	if (isClassPropertyInitializer(enclosingFunction)) {
		return true;
	}

	if (isConstructor(enclosingFunction, capIsConstructor)) {
		return true;
	}

	if (isObjectMethod(enclosingFunction)) {
		return true;
	}

	if (isPropertyAssignment(enclosingFunction)) {
		return true;
	}

	if (isBindCallApply(enclosingFunction)) {
		return true;
	}

	if (isArrayMethodWithThisArg(enclosingFunction)) {
		return true;
	}

	return false;
}

function isValidThisContextForArrow(
	arrow: AST.ArrowFunction,
	capIsConstructor: boolean,
): boolean {
	let current: ts.Node | undefined = arrow.parent;

	while (current) {
		switch (current.kind) {
			case ts.SyntaxKind.ArrowFunction:
				break;
			case ts.SyntaxKind.ClassDeclaration:
			case ts.SyntaxKind.ClassExpression:
			case ts.SyntaxKind.ClassStaticBlockDeclaration:
				return true;
			case ts.SyntaxKind.FunctionDeclaration:
			case ts.SyntaxKind.FunctionExpression:
			case ts.SyntaxKind.GetAccessor:
			case ts.SyntaxKind.MethodDeclaration:
			case ts.SyntaxKind.SetAccessor: {
				const functionNode = current as FunctionLike;

				if (isClassMember(functionNode)) {
					return true;
				}

				if (isClassPropertyInitializer(functionNode)) {
					return true;
				}

				if (isConstructor(functionNode, capIsConstructor)) {
					return true;
				}

				if (isObjectMethod(functionNode)) {
					return true;
				}

				if (isPropertyAssignment(functionNode)) {
					return true;
				}

				if (isBindCallApply(functionNode)) {
					return true;
				}

				if (isArrayMethodWithThisArg(functionNode)) {
					return true;
				}

				return false;
			}
			case ts.SyntaxKind.PropertyDeclaration:
				if (
					ts.isClassDeclaration(current.parent) ||
					ts.isClassExpression(current.parent)
				) {
					return true;
				}
				break;
		}

		current = current.parent as ts.Node | undefined;
	}

	return false;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports usage of `this` in contexts where its value is `undefined`.",
		id: "invalidThis",
		presets: ["untyped"],
	},
	messages: {
		invalidThis: {
			primary: "Unexpected `this` in a context where its value is `undefined`.",
			secondary: [
				"In strict mode, `this` is `undefined` in functions that are not methods, constructors, or bound to an object.",
				"Using `this` in such contexts typically indicates a bug or misunderstanding of how `this` works in JavaScript.",
			],
			suggestions: [
				"Convert to a method on an object or class.",
				"Use `.bind()`, `.call()`, or `.apply()` to explicitly set the `this` value.",
				"Use an arrow function if you need to capture `this` from an enclosing scope.",
			],
		},
	},
	options: {
		capIsConstructor: z
			.boolean()
			.default(true)
			.describe(
				"Whether to assume functions starting with an uppercase letter are constructors.",
			),
	},
	setup(context) {
		return {
			visitors: {
				ThisKeyword: (node, { options, sourceFile }) => {
					if (isValidThisContext(node, options.capIsConstructor)) {
						return;
					}

					context.report({
						message: "invalidThis",
						range: getTSNodeRange(node, sourceFile),
					});
				},
			},
		};
	},
});
