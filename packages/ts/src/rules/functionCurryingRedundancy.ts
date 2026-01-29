import {
	type AST,
	isFunction,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import { nullThrows } from "@flint.fyi/utils";
import { SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports using `.apply()` or `.call()` or  when the context (`this` value) provides no benefit.",
		id: "functionCurryingRedundancy",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		unnecessaryCall: {
			primary:
				'This "currying" of a function without a defined context does nothing and can be simplified.',
			secondary: [
				"Using `.{{ method }}()` with null or undefined as the context provides no benefit over a direct function call.",
				"This adds unnecessary complexity and reduces code readability.",
			],
			suggestions: [
				"Replace the `.{{ method }}()` with a direct function call.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression: (node, { sourceFile, typeChecker }) => {
					if (node.expression.kind !== SyntaxKind.PropertyAccessExpression) {
						return;
					}

					const method = node.expression.name.text;
					if (
						(method !== "call" && method !== "apply") ||
						!node.arguments.length ||
						!isFunction(node.expression.expression, typeChecker)
					) {
						return;
					}

					const firstArgument = nullThrows(
						node.arguments[0],
						"First argument is expected to be present by prior length check",
					);
					if (
						firstArgument.kind !== SyntaxKind.NullKeyword &&
						!(
							firstArgument.kind === SyntaxKind.Identifier &&
							firstArgument.text === "undefined"
						)
					) {
						return;
					}

					const fixTextCreator =
						method === "apply" ? createApplyFixText : createCallFixText;

					context.report({
						data: { method },
						fix: {
							range: {
								begin: node.getStart(sourceFile),
								end: node.getEnd(),
							},
							text: fixTextCreator(
								node.expression.expression.getText(sourceFile),
								node.arguments.slice(1),
								sourceFile,
							),
						},
						message: "unnecessaryCall",
						range: {
							begin: node.expression.name.getStart(sourceFile) - 1,
							end: node.getEnd(),
						},
					});
				},
			},
		};
	},
});

function createApplyFixText(
	functionExpression: string,
	methodArguments: AST.Expression[],
	sourceFile: AST.SourceFile,
) {
	if (methodArguments.length === 0) {
		return `${functionExpression}()`;
	}

	const argsArray = nullThrows(
		methodArguments[0],
		"First argument is expected to be present by prior length check",
	);

	return `${functionExpression}(...${argsArray.getText(sourceFile)})`;
}

function createCallFixText(
	functionExpression: string,
	methodArguments: AST.Expression[],
	sourceFile: AST.SourceFile,
) {
	const argsText = methodArguments
		.map((arg) => arg.getText(sourceFile))
		.join(", ");
	return `${functionExpression}(${argsText})`;
}
