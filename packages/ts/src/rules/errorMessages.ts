import {
	type AST,
	type Checker,
	getTSNodeRange,
	isGlobalDeclarationOfName,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import { SyntaxKind } from "typescript";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

const errorConstructors = [
	"AggregateError",
	"Error",
	"EvalError",
	"RangeError",
	"ReferenceError",
	"SyntaxError",
	"TypeError",
	"URIError",
];

function getErrorConstructorWithoutMessage(
	node: AST.CallExpression | AST.NewExpression,
	typeChecker: Checker,
) {
	if (
		node.expression.kind !== SyntaxKind.Identifier ||
		hasValidMessageArgument(node.arguments)
	) {
		return false;
	}

	return errorConstructors.find((errorConstructor) =>
		isGlobalDeclarationOfName(node.expression, errorConstructor, typeChecker),
	);
}

function hasValidMessageArgument(
	args: ts.NodeArray<AST.Expression> | undefined,
) {
	if (!args?.length) {
		return false;
	}

	const firstArgument = args[0];

	return (
		!!firstArgument &&
		!isEmptyString(firstArgument) &&
		!isUndefinedLiteral(firstArgument)
	);
}

// TODO: Use a util like getStaticValue
// https://github.com/flint-fyi/flint/issues/1298
function isEmptyString(node: AST.Expression) {
	if (
		node.kind === SyntaxKind.StringLiteral ||
		node.kind === SyntaxKind.NoSubstitutionTemplateLiteral
	) {
		return node.text === "";
	}

	return false;
}

function isUndefinedLiteral(node: AST.Expression) {
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
				"`{{ errorConstructor }}`s created without a message are generally harder to debug.",
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
		function checkNode(
			node: AST.CallExpression | AST.NewExpression,
			{ sourceFile, typeChecker }: TypeScriptFileServices,
		) {
			const errorConstructor = getErrorConstructorWithoutMessage(
				node,
				typeChecker,
			);

			if (errorConstructor) {
				context.report({
					data: { errorConstructor },
					message: "missingMessage",
					range: getTSNodeRange(node.expression, sourceFile),
				});
			}
		}
		return {
			visitors: {
				CallExpression: checkNode,
				NewExpression: checkNode,
			},
		};
	},
});
