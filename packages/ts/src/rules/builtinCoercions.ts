import { SyntaxKind } from "typescript";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

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

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports functions that wrap native coercion functions like `String`, `Number`, `BigInt`, `Boolean`, or `Symbol`.",
		id: "builtinCoercions",
		presets: ["stylistic", "stylisticStrict"],
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
	if (statement?.kind !== SyntaxKind.ReturnStatement || !statement.expression) {
		return false;
	}

	return expressionMatchesName(statement.expression, parameterName);
}

function expressionMatchesName(expression: AST.ConciseBody, name: string) {
	const unwrapped =
		expression.kind === SyntaxKind.ParenthesizedExpression
			? expression.expression
			: expression;

	return unwrapped.kind === SyntaxKind.Identifier && unwrapped.text === name;
}

function getCoercionCallName(
	expression: AST.ConciseBody,
	parameterName: string,
): string | undefined {
	if (
		expression.kind !== SyntaxKind.CallExpression ||
		expression.expression.kind !== SyntaxKind.Identifier
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
		argument?.kind !== SyntaxKind.Identifier ||
		argument.text !== parameterName
	) {
		return undefined;
	}

	return calleeName;
}

function getCoercionWrapperProblem(
	node: AST.ArrowFunction | AST.FunctionExpression,
	parameterName: string,
	sourceFile: AST.SourceFile,
) {
	if (node.parameters.length !== 1) {
		return;
	}

	const coercionFunction = getWrappedCoercionFunction(node, parameterName);
	if (!coercionFunction) {
		return;
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
	sourceFile: AST.SourceFile,
) {
	const soleParameterText = getSoleParameterText(node);
	if (!soleParameterText) {
		return;
	}

	return (
		getIdentityCallbackProblem(node, soleParameterText, sourceFile) ??
		getCoercionWrapperProblem(node, soleParameterText, sourceFile)
	);
}

function getIdentityCallbackProblem(
	node: AST.ArrowFunction | AST.FunctionExpression,
	soleParameterText: string,
	sourceFile: AST.SourceFile,
) {
	if (
		!isIdentityFunction(node, soleParameterText) ||
		!isArrayMethodCallback(node)
	) {
		return;
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
		return;
	}

	const parameter = node.parameters[0];
	if (parameter?.name.kind !== SyntaxKind.Identifier) {
		return;
	}

	return parameter.name.text;
}

function getWrappedCoercionFunction(
	node: AST.ArrowFunction | AST.FunctionExpression,
	parameterName: string,
): string | undefined {
	if (
		node.kind === SyntaxKind.ArrowFunction &&
		node.body.kind !== SyntaxKind.Block
	) {
		return getCoercionCallName(node.body, parameterName);
	}

	if (
		node.body.kind !== SyntaxKind.Block ||
		node.body.statements.length !== 1
	) {
		return undefined;
	}

	const statement = node.body.statements[0];
	if (statement?.kind !== SyntaxKind.ReturnStatement || !statement.expression) {
		return undefined;
	}

	return getCoercionCallName(statement.expression, parameterName);
}

function isArrayMethodCallback(
	node: AST.ArrowFunction | AST.FunctionExpression,
) {
	return (
		node.parent.kind === SyntaxKind.CallExpression &&
		node.parent.arguments[0] === node &&
		node.parent.expression.kind === SyntaxKind.PropertyAccessExpression &&
		arrayMethodsWithBooleanCallback.has(node.parent.expression.name.text)
	);
}

function isIdentityFunction(
	node: AST.ArrowFunction | AST.FunctionExpression,
	soleParameterText: string,
) {
	if (
		node.kind === SyntaxKind.ArrowFunction &&
		node.body.kind !== SyntaxKind.Block
	) {
		return expressionMatchesName(node.body, soleParameterText);
	}

	return (
		node.body.kind === SyntaxKind.Block &&
		blockReturnsIdentifier(node.body, soleParameterText)
	);
}
