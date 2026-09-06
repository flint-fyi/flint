import { SyntaxKind } from "typescript-native/unstable/ast";
import type { Checker, Symbol, Type } from "typescript-native/unstable/sync";

import {
	forEachChild,
	getTSNodeRange,
	typescriptLanguage,
	type AST,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports async functions that do not use await.",
		id: "asyncFunctionAwaits",
		presets: ["logicalStrict"],
	},
	messages: {
		missingAwait: {
			primary:
				"This function is marked `async` but does not contain an `await` expression or return a Promise.",
			secondary: [
				"Async functions always wrap their return value in a Promise, which adds overhead if you're not using await.",
				"This may indicate incomplete implementation or leftover code after refactoring.",
			],
			suggestions: [
				"Add an `await` expression if you need to wait for asynchronous operations.",
				"Remove the `async` keyword if the function doesn't need to be asynchronous.",
			],
		},
	},
	setup(context) {
		function checkFunction(
			node:
				| AST.ArrowFunction
				| AST.FunctionDeclaration
				| AST.FunctionExpression
				| AST.MethodDeclaration,
			{ sourceFile, typeChecker }: TypeScriptFileServices,
		): void {
			const asyncModifier = node.modifiers?.find(
				(modifier) => modifier.kind === SyntaxKind.AsyncKeyword,
			);

			if (
				!asyncModifier ||
				node.asteriskToken ||
				!node.body ||
				isEmptyBody(node.body) ||
				checkForAwait(node.body) ||
				bodyReturnsThenable(node.body, typeChecker)
			) {
				return;
			}

			context.report({
				message: "missingAwait",
				range: getTSNodeRange(asyncModifier, sourceFile),
			});
		}

		return {
			visitors: {
				ArrowFunction: checkFunction,
				FunctionDeclaration: checkFunction,
				FunctionExpression: checkFunction,
				MethodDeclaration: checkFunction,
			},
		};
	},
});

function bodyReturnsThenable(
	body: AST.Block | AST.Expression,
	typeChecker: Checker,
): boolean | undefined {
	if (body.kind !== SyntaxKind.Block) {
		return isThenableType(typeChecker, body);
	}

	function checkReturnStatements(node: AST.AnyNode): boolean | undefined {
		if (
			node.kind === SyntaxKind.ReturnStatement &&
			node.expression &&
			isThenableType(typeChecker, node.expression)
		) {
			return true;
		}

		if (isFunctionScopeBoundary(node)) {
			return false;
		}

		return forEachChild(node, checkReturnStatements);
	}

	return forEachChild(body, checkReturnStatements);
}

// TODO: Use a scope analyzer (#400)?
function checkForAwait(node: AST.AnyNode): boolean | undefined {
	if (node.kind === SyntaxKind.AwaitExpression) {
		return true;
	}

	if (node.kind === SyntaxKind.ForOfStatement && node.awaitModifier) {
		return true;
	}

	if (isFunctionScopeBoundary(node)) {
		return false;
	}

	return forEachChild(node, checkForAwait);
}

function getUnionConstituents(type: Type): readonly Type[] {
	return type.isUnionType() ? type.getTypes() : [type];
}

function isCallback(
	typeChecker: Checker,
	parameter: Symbol,
	node: AST.AnyNode,
): boolean {
	let type = typeChecker.getApparentType(
		typeChecker.getTypeOfSymbolAtLocation(parameter, node),
	);
	const declaration = parameter.valueDeclaration?.resolve();
	if (
		declaration?.kind === SyntaxKind.Parameter &&
		"dotDotDotToken" in declaration &&
		declaration.dotDotDotToken
	) {
		if (typeof type.getNumberIndexType !== "function") {
			return false;
		}
		const elementType = type.getNumberIndexType();
		if (!elementType) {
			return false;
		}
		type = elementType;
	}

	return getUnionConstituents(type).some(
		(constituent) => constituent.getCallSignatures().length !== 0,
	);
}

function isEmptyBody(body: AST.Block | AST.Expression): boolean {
	return body.kind === SyntaxKind.Block && !body.statements.length;
}

function isFunctionScopeBoundary(node: AST.AnyNode): boolean {
	switch (node.kind) {
		case SyntaxKind.ArrowFunction:
		case SyntaxKind.CallSignature:
		case SyntaxKind.ClassDeclaration:
		case SyntaxKind.ClassExpression:
		case SyntaxKind.Constructor:
		case SyntaxKind.ConstructorType:
		case SyntaxKind.ConstructSignature:
		case SyntaxKind.EnumDeclaration:
		case SyntaxKind.FunctionDeclaration:
		case SyntaxKind.FunctionExpression:
		case SyntaxKind.FunctionType:
		case SyntaxKind.GetAccessor:
		case SyntaxKind.MethodDeclaration:
		case SyntaxKind.MethodSignature:
		case SyntaxKind.ModuleDeclaration:
		case SyntaxKind.SetAccessor:
			return true;
	}

	return false;
}

function isThenableType(typeChecker: Checker, node: AST.AnyNode): boolean {
	for (const constituent of getUnionConstituents(
		typeChecker.getApparentType(typeChecker.getTypeAtLocation(node)),
	)) {
		const then = constituent.getProperty("then");
		if (!then) {
			continue;
		}

		for (const thenType of getUnionConstituents(
			typeChecker.getTypeOfSymbolAtLocation(then, node),
		)) {
			for (const signature of thenType.getCallSignatures()) {
				const parameter = signature.getParameters()[0];
				if (parameter && isCallback(typeChecker, parameter, node)) {
					return true;
				}
			}
		}
	}

	return false;
}
