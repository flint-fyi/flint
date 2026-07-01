import * as tsutils from "ts-api-utils";
import * as ts from "typescript";

import {
	getScopeManager,
	getTSNodeRange,
	typescriptLanguage,
	type AST,
	type ScopeManager,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { getFunctionName } from "./utils/getFunctionName.ts";

function isParameterOnlyUsedInRecursion(
	parameter: AST.ParameterDeclaration,
	parameterIndex: number,
	functionName: string,
	functionNode:
		| AST.ArrowFunction
		| AST.FunctionDeclaration
		| AST.FunctionExpression
		| AST.MethodDeclaration,
	scopeManager: ScopeManager,
) {
	if (!ts.isIdentifier(parameter.name) || !functionNode.body) {
		return false;
	}

	const [variable] = scopeManager.getDeclaredVariables(parameter);
	if (!variable) {
		return false;
	}

	const { references } = variable;

	return (
		references.length &&
		references.every((reference) =>
			isReferenceOnlyUsedInRecursion(
				reference.identifier,
				parameterIndex,
				functionName,
				functionNode,
			),
		)
	);
}

function isRecursiveCall(
	callExpression: ts.CallExpression,
	functionName: string,
	functionNode: ts.Node,
): boolean {
	const callee = callExpression.expression;

	let calleeMatchesFunctionName = false;

	if (ts.isIdentifier(callee)) {
		calleeMatchesFunctionName = callee.text === functionName;
	} else if (
		ts.isPropertyAccessExpression(callee) &&
		callee.expression.kind === ts.SyntaxKind.ThisKeyword &&
		ts.isIdentifier(callee.name)
	) {
		calleeMatchesFunctionName = callee.name.text === functionName;
	}

	if (!calleeMatchesFunctionName) {
		return false;
	}

	for (
		let current: ts.Node | undefined = callExpression.parent;
		current;
		current = current.parent as ts.Node | undefined
	) {
		if (current === functionNode) {
			return true;
		}
		if (tsutils.isFunctionScopeBoundary(current)) {
			return false;
		}
	}

	return false;
}

function isReferenceOnlyUsedInRecursion(
	reference: ts.Identifier,
	parameterIndex: number,
	functionName: string,
	functionNode: ts.Node,
): boolean {
	const parent = reference.parent;

	if (!ts.isCallExpression(parent)) {
		return false;
	}

	if (!isRecursiveCall(parent, functionName, functionNode)) {
		return false;
	}

	const argumentIndex = parent.arguments.findIndex(
		(argument) => argument === reference,
	);

	return argumentIndex === parameterIndex;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports function parameters that are only used in recursive calls.",
		id: "recursionOnlyArguments",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		onlyUsedInRecursion: {
			primary: "This parameter is only used in recursive calls.",
			secondary: [
				"Parameters that are only passed through to recursive calls serve no functional purpose.",
				"This increases cognitive complexity and may impact performance.",
			],
			suggestions: [
				"Remove the parameter if it's not needed.",
				"Use the parameter in the function body for some computation.",
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
			{ sourceFile }: TypeScriptFileServices,
		) {
			const functionName = getFunctionName(node);
			if (!functionName || !node.body) {
				return;
			}

			const scopeManager = getScopeManager(sourceFile);

			for (const [parameterIndex, parameter] of node.parameters.entries()) {
				if (
					isParameterOnlyUsedInRecursion(
						parameter,
						parameterIndex,
						functionName,
						node,
						scopeManager,
					)
				) {
					context.report({
						message: "onlyUsedInRecursion",
						range: getTSNodeRange(parameter.name, sourceFile),
					});
				}
			}
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
