import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function isNodeWithinKeyofAny(node: AST.AnyKeyword) {
	return (
		node.parent.kind === ts.SyntaxKind.TypeOperator &&
		node.parent.operator === ts.SyntaxKind.KeyOfKeyword
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports explicit uses of the any type.",
		id: "explicitAnys",
		presets: ["logical"],
	},
	messages: {
		noExplicitAny: {
			primary:
				"Avoid using the `any` type as it disables type checking for the annotated value.",
			secondary: [
				"Using `any` eliminates many of the benefits of TypeScript's type system.",
				"It allows `any` operation on the value without compile-time checks.",
				"Errors that could be caught at compile time may only appear at runtime.",
			],
			suggestions: [
				"Use `unknown` instead if you need to accept `any` value but want type safety.",
				"Use a more specific type if the possible values are known.",
				"For generic classes and functions, use type parameters to preserve type information across calls.",
				"For keyof `any`, consider using `PropertyKey` instead.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				AnyKeyword: (node, { sourceFile }) => {
					const isKeyofAny = isNodeWithinKeyofAny(node);
					const range = getTSNodeRange(node, sourceFile);

					context.report({
						message: "noExplicitAny",
						range,
						suggestions: isKeyofAny
							? [
									{
										id: "propertyKey",
										range: getTSNodeRange(node.parent, sourceFile),
										text: "PropertyKey",
									},
								]
							: [
									{
										id: "unknown",
										range,
										text: "unknown",
									},
									{
										id: "never",
										range,
										text: "never",
									},
								],
					});
				},
			},
		};
	},
});
