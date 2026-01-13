import * as ts from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import {
	type TypeScriptFileServices,
	typescriptLanguage,
} from "../language.ts";
import type * as AST from "../types/ast.ts";

const nativeCoercionFunctions = new Set([
	"BigInt",
	"Boolean",
	"Number",
	"String",
	"Symbol",
]);

const arrayMethodsWithBooleanCallback = new Set([
	"every",
	"filter",
	"find",
	"findIndex",
	"findLast",
	"findLastIndex",
	"some",
]);

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports functions that wrap native coercion functions like `String`, `Number`, `BigInt`, `Boolean`, or `Symbol`.",
		id: "builtinCoercions",
		preset: "stylistic",
	},
	messages: {
		useBuiltin: {
			primary:
				"Prefer using `{{ coercionFunction }}` directly instead of wrapping it in a function.",
			secondary: [
				"Wrapping a native coercion function in another function adds unnecessary indirection.",
				"Using the built-in function directly is more concise and expresses intent more clearly.",
			],
			suggestions: ["Replace this function with `{{ coercionFunction }}`."],
		},
	},
	setup(context) {
		function checkFunction(
			node: AST.ArrowFunction | AST.FunctionExpression,
			{ sourceFile }: TypeScriptFileServices,
		) {
			const problem = getFunctionProblem(node, sourceFile);
			if (problem) {
				context.report(problem);
			}
		}

		return {
			visitors: {
				ArrowFunction: checkFunction,
				FunctionExpression: checkFunction,
			},
		};
	},
});

function blockReturnsIdentifier(block: AST.Block, parameterName: string) {
	if (block.statements.length !== 1) {
		return false;
	}

	const statement = block.statements[0];
	if (!statement || !ts.isReturnStatement(statement) || !statement.expression) {
		return false;
	}

	return expressionMatchesName(statement.expression, parameterName);
}

function expressionMatchesName(expression: AST.ConciseBody, name: string) {
	const unwrapped = ts.isParenthesizedExpression(expression)
		? expression.expression
		: expression;

	return ts.isIdentifier(unwrapped) && unwrapped.text === name;
}

function getCoercionCallName(
	expression: AST.ConciseBody,
	parameterName: string,
): string | undefined {
	if (
		!ts.isCallExpression(expression) ||
		!ts.isIdentifier(expression.expression)
	) {
		return undefined;
	}

	const calleeName = expression.expression.text;
	if (
		!nativeCoercionFunctions.has(calleeName) ||
		expression.arguments.length !== 1
	) {
		return undefined;
	}

	const argument = expression.arguments[0];
	if (
		!argument ||
		!ts.isIdentifier(argument) ||
		argument.text !== parameterName
	) {
		return undefined;
	}

	return calleeName;
}

function getCoercionWrapperProblem(
	node: AST.ArrowFunction | AST.FunctionExpression,
	parameterName: string,
	sourceFile: ts.SourceFile,
) {
	if (node.parameters.length !== 1) {
		return undefined;
	}

	const coercionFunction = getWrappedCoercionFunction(node, parameterName);
	if (!coercionFunction) {
		return undefined;
	}

	const range = getTSNodeRange(node, sourceFile);
	return {
		data: { coercionFunction },
		fix: {
			range,
			text: coercionFunction,
		},
		message: "useBuiltin" as const,
		range,
	};
}

function getFunctionProblem(
	node: AST.ArrowFunction | AST.FunctionExpression,
	sourceFile: ts.SourceFile,
) {
	const soleParameterText = getSoleParameterText(node);
	if (!soleParameterText) {
		return undefined;
	}

	return (
		getIdentityCallbackProblem(node, soleParameterText, sourceFile) ??
		getCoercionWrapperProblem(node, soleParameterText, sourceFile)
	);
}

function getIdentityCallbackProblem(
	node: AST.ArrowFunction | AST.FunctionExpression,
	soleParameterText: string,
	sourceFile: ts.SourceFile,
) {
	if (
		!isIdentityFunction(node, soleParameterText) ||
		!isArrayMethodCallback(node)
	) {
		return undefined;
	}

	const range = getTSNodeRange(node, sourceFile);

	return {
		data: { coercionFunction: "Boolean" },
		fix: {
			range,
			text: "Boolean",
		},
		message: "useBuiltin" as const,
		range,
	};
}

function getSoleParameterText(
	node: AST.ArrowFunction | AST.FunctionExpression,
) {
	if (node.parameters.length !== 1) {
		return undefined;
	}

	const parameter = node.parameters[0];
	if (!parameter || !ts.isIdentifier(parameter.name)) {
		return undefined;
	}

	return parameter.name.text;
}

function getWrappedCoercionFunction(
	node: AST.ArrowFunction | AST.FunctionExpression,
	parameterName: string,
): string | undefined {
	if (node.kind === ts.SyntaxKind.ArrowFunction && !ts.isBlock(node.body)) {
		return getCoercionCallName(node.body, parameterName);
	}

	if (!ts.isBlock(node.body) || node.body.statements.length !== 1) {
		return undefined;
	}

	const statement = node.body.statements[0];
	if (!statement || !ts.isReturnStatement(statement) || !statement.expression) {
		return undefined;
	}

	return getCoercionCallName(statement.expression, parameterName);
}

function isArrayMethodCallback(
	node: AST.ArrowFunction | AST.FunctionExpression,
) {
	return (
		ts.isCallExpression(node.parent) &&
		node.parent.arguments[0] === node &&
		ts.isPropertyAccessExpression(node.parent.expression) &&
		arrayMethodsWithBooleanCallback.has(node.parent.expression.name.text)
	);
}

function isIdentityFunction(
	node: AST.ArrowFunction | AST.FunctionExpression,
	soleParameterText: string,
) {
	if (node.kind === ts.SyntaxKind.ArrowFunction && !ts.isBlock(node.body)) {
		return expressionMatchesName(node.body, soleParameterText);
	}

	return (
		ts.isBlock(node.body) &&
		blockReturnsIdentifier(node.body, soleParameterText)
	);
}
