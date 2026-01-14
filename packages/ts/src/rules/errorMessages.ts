import { SyntaxKind } from "typescript";
import ts from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import type { Checker } from "../index.ts";
import { typescriptLanguage } from "../language.ts";
import type * as AST from "../types/ast.ts";
import { isGlobalDeclarationOfName } from "../utils/isGlobalDeclarationOfName.ts";
import { ruleCreator } from "./ruleCreator.ts";

const ERROR_CONSTRUCTORS = new Set([
	"AggregateError",
	"Error",
	"EvalError",
	"RangeError",
	"ReferenceError",
	"SyntaxError",
	"TypeError",
	"URIError",
]);

function checkErrorConstruction(
	node: AST.CallExpression | AST.NewExpression,
	typeChecker: Checker,
): string | undefined {
	const callee = node.expression;

	if (callee.kind !== SyntaxKind.Identifier) {
		return undefined;
	}

	const name = callee.text;
	if (!ERROR_CONSTRUCTORS.has(name)) {
		return undefined;
	}

	if (!isGlobalDeclarationOfName(callee, name, typeChecker)) {
		return undefined;
	}

	if (!node.arguments || !hasValidMessageArgument(node.arguments)) {
		return name;
	}

	return undefined;
}

function hasValidMessageArgument(args: ts.NodeArray<AST.Expression>): boolean {
	const firstArg = args[0];
	if (!firstArg) {
		return false;
	}

	if (isEmptyString(firstArg)) {
		return false;
	}

	if (isUndefinedLiteral(firstArg)) {
		return false;
	}

	return true;
}

function isEmptyString(node: AST.Expression): boolean {
	if (node.kind === SyntaxKind.StringLiteral) {
		return node.text === "";
	}

	if (node.kind === SyntaxKind.NoSubstitutionTemplateLiteral) {
		return node.text === "";
	}

	return false;
}

function isUndefinedLiteral(node: AST.Expression): boolean {
	return node.kind === SyntaxKind.Identifier && node.text === "undefined";
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Requires a message value when creating a built-in error.",
		id: "errorMessages",
		presets: ["logicalStrict"],
	},
	messages: {
		missingMessage: {
			primary:
				"{{ errorType }} constructor should be called with a message argument.",
			secondary: [
				"Error instances without messages are harder to debug because they don't explain what went wrong.",
				"A descriptive error message helps developers understand and fix issues more quickly.",
			],
			suggestions: [
				"Provide a string message describing what caused the error.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression: (node, { sourceFile, typeChecker }) => {
					const errorType = checkErrorConstruction(node, typeChecker);
					if (errorType) {
						context.report({
							data: { errorType },
							message: "missingMessage",
							range: getTSNodeRange(node.expression, sourceFile),
						});
					}
				},
				NewExpression: (node, { sourceFile, typeChecker }) => {
					const errorType = checkErrorConstruction(node, typeChecker);
					if (errorType) {
						context.report({
							data: { errorType },
							message: "missingMessage",
							range: getTSNodeRange(node.expression, sourceFile),
						});
					}
				},
			},
		};
	},
});
