import {
	type AST,
	type Checker,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

const arrayMethods = new Set([
	"concat",
	"filter",
	"flat",
	"flatMap",
	"map",
	"reverse",
	"slice",
	"sort",
	"splice",
	"toReversed",
	"toSorted",
	"toSpliced",
]);

interface IncludesCallInfo {
	callExpression: AST.CallExpression;
	isInLoopOrFunction: boolean;
}

function collectReferences(
	identifier: AST.Identifier,
	sourceFile: AST.SourceFile,
	typeChecker: Checker,
): { allIncludesOnly: boolean; includesCalls: IncludesCallInfo[] } {
	const symbol = typeChecker.getSymbolAtLocation(identifier);
	if (!symbol?.valueDeclaration) {
		return { allIncludesOnly: false, includesCalls: [] };
	}

	const valueDeclaration = symbol.valueDeclaration;
	const includesCalls: IncludesCallInfo[] = [];
	let hasOtherUsage = false;

	function visit(node: ts.Node): void {
		if (hasOtherUsage) {
			return;
		}

		if (ts.isIdentifier(node) && node !== identifier) {
			const nodeSymbol = typeChecker.getSymbolAtLocation(node);
			if (
				nodeSymbol?.valueDeclaration &&
				nodeSymbol.valueDeclaration === valueDeclaration
			) {
				const parent = node.parent;

				if (
					ts.isPropertyAccessExpression(parent) &&
					parent.expression === node &&
					parent.name.text === "includes"
				) {
					const grandparent = parent.parent;

					if (
						ts.isCallExpression(grandparent) &&
						grandparent.expression === parent &&
						grandparent.arguments.length === 1 &&
						!grandparent.questionDotToken
					) {
						if (!parent.questionDotToken) {
							includesCalls.push({
								callExpression: grandparent,
								isInLoopOrFunction: isInLoopOrFunction(grandparent),
							});
							ts.forEachChild(node, visit);
							return;
						}
					}
				}

				hasOtherUsage = true;
			}
		}

		ts.forEachChild(node, visit);
	}

	visit(sourceFile);

	return {
		allIncludesOnly: !hasOtherUsage,
		includesCalls,
	};
}

function isArrayInitializer(expression: AST.Expression): boolean {
	if (ts.isArrayLiteralExpression(expression)) {
		return true;
	}

	if (ts.isCallExpression(expression)) {
		const { expression: callee } = expression;

		if (ts.isIdentifier(callee) && callee.text === "Array") {
			return true;
		}

		if (
			ts.isPropertyAccessExpression(callee) &&
			ts.isIdentifier(callee.expression) &&
			callee.expression.text === "Array" &&
			(callee.name.text === "from" || callee.name.text === "of")
		) {
			return true;
		}

		if (
			ts.isPropertyAccessExpression(callee) &&
			arrayMethods.has(callee.name.text)
		) {
			return true;
		}
	}

	if (
		ts.isNewExpression(expression) &&
		ts.isIdentifier(expression.expression) &&
		expression.expression.text === "Array"
	) {
		return true;
	}

	return false;
}

function isExported(node: AST.VariableStatement): boolean {
	return (
		node.modifiers?.some(
			(modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
		) ?? false
	);
}

function isInLoopOrFunction(node: ts.Node): boolean {
	let current = node.parent as ts.Node | undefined;

	while (current) {
		if (
			ts.isForStatement(current) ||
			ts.isForInStatement(current) ||
			ts.isForOfStatement(current) ||
			ts.isWhileStatement(current) ||
			ts.isDoStatement(current) ||
			ts.isFunctionDeclaration(current) ||
			ts.isFunctionExpression(current) ||
			ts.isArrowFunction(current) ||
			ts.isMethodDeclaration(current)
		) {
			return true;
		}

		current = current.parent as ts.Node | undefined;
	}

	return false;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Prefer `Set.has()` over `Array.includes()` for repeated existence checks.",
		id: "setHasExistenceChecks",
		presets: ["stylisticStrict"],
	},
	messages: {
		preferSet: {
			primary:
				"This array is only used for existence checks. Prefer `Set` with `.has()` for better performance.",
			secondary: [
				"`Set.has()` has O(1) lookup time compared to `Array.includes()` which is O(n).",
			],
			suggestions: [
				"Convert the array to a `Set` and use `.has()` instead of `.includes()`.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				VariableStatement: (node, { sourceFile, typeChecker }) => {
					if (isExported(node)) {
						return;
					}

					if (!(node.declarationList.flags & ts.NodeFlags.Const)) {
						return;
					}

					for (const declaration of node.declarationList.declarations) {
						if (
							!ts.isIdentifier(declaration.name) ||
							!declaration.initializer ||
							!isArrayInitializer(declaration.initializer)
						) {
							continue;
						}

						const { allIncludesOnly, includesCalls } = collectReferences(
							declaration.name,
							sourceFile,
							typeChecker,
						);

						if (!allIncludesOnly || includesCalls.length === 0) {
							continue;
						}

						const hasMultipleCalls = includesCalls.length > 1;
						const hasCallInLoopOrFunction = includesCalls.some(
							(info) => info.isInLoopOrFunction,
						);

						if (hasMultipleCalls || hasCallInLoopOrFunction) {
							context.report({
								message: "preferSet",
								range: getTSNodeRange(declaration.name, sourceFile),
							});
						}
					}
				},
			},
		};
	},
});
