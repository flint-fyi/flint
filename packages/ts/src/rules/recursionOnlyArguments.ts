import {
	type AST,
	getTSNodeRange,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as tsutils from "ts-api-utils";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";
import { getFunctionName } from "./utils/getFunctionName.ts";

// TODO: This will be more clean when there is a scope manager
// https://github.com/flint-fyi/flint/issues/400
function collectParameterReferences(
	parameterName: string,
	parameterNode: ts.Identifier,
	functionNode: ts.Node,
	functionBody: ts.Node,
) {
	const references: ts.Identifier[] = [];

	function collectNode(node: ts.Node): void {
		if (tsutils.isFunctionScopeBoundary(node) && node !== functionNode) {
			return;
		}

		if (
			ts.isIdentifier(node) &&
			node.text === parameterName &&
			node !== parameterNode
		) {
			references.push(node);
		}

		ts.forEachChild(node, collectNode);
	}

	ts.forEachChild(functionBody, collectNode);

	return references;
}

function isParameterOnlyUsedInRecursion(
	parameter: AST.ParameterDeclaration,
	parameterIndex: number,
	functionName: string,
	functionNode:
		| AST.ArrowFunction
		| AST.FunctionDeclaration
		| AST.FunctionExpression
		| AST.MethodDeclaration,
) {
	if (!ts.isIdentifier(parameter.name) || !functionNode.body) {
		return false;
	}

	const references = collectParameterReferences(
		parameter.name.text,
		parameter.name,
		functionNode,
		functionNode.body,
	);

	return (
		references.length &&
		references.every((reference) =>
			isReferenceOnlyUsedInRecursion(
				reference,
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
		presets: ["logical"],
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

			for (const [parameterIndex, parameter] of node.parameters.entries()) {
				if (
					isParameterOnlyUsedInRecursion(
						parameter,
						parameterIndex,
						functionName,
						node,
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
