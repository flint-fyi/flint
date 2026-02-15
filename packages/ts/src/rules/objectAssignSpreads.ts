import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import type { AST, Checker } from "@flint.fyi/typescript-language";
import { isGlobalDeclarationOfName } from "@flint.fyi/typescript-language";
import { SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function hasAccessors(node: AST.ObjectLiteralExpression) {
	return node.properties.some(
		(property) =>
			property.kind === SyntaxKind.GetAccessor ||
			property.kind === SyntaxKind.SetAccessor,
	);
}

function hasArgumentsWithAccessors(node: AST.CallExpression) {
	return (
		node.arguments.length > 1 &&
		node.arguments
			.filter(
				(argument): argument is AST.ObjectLiteralExpression =>
					argument.kind === SyntaxKind.ObjectLiteralExpression,
			)
			.some(hasAccessors)
	);
}

function hasArraySpread(node: AST.CallExpression) {
	return node.arguments.some(
		(argument) => argument.kind === SyntaxKind.SpreadElement,
	);
}

function isObjectAssignCall(
	node: AST.CallExpression,
	typeChecker: Checker,
): boolean {
	return (
		node.expression.kind === SyntaxKind.PropertyAccessExpression &&
		node.expression.name.kind === SyntaxKind.Identifier &&
		node.expression.name.text === "assign" &&
		node.expression.expression.kind === SyntaxKind.Identifier &&
		isGlobalDeclarationOfName(node.expression.expression, "Object", typeChecker)
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Prefer object spread syntax over `Object.assign()` when the first argument is an object literal.",
		id: "objectAssignSpreads",
		presets: ["stylistic", "stylisticStrict"],
	},
	messages: {
		preferObjectLiteral: {
			primary:
				"`Object.assign()` with a single object literal argument is unnecessary.",
			secondary: [
				"When `Object.assign()` is called with only one object literal argument, the result is identical to using the literal directly.",
				"Using the object literal directly is simpler and more readable.",
			],
			suggestions: [
				"Replace `Object.assign({ prop: value })` with `{ prop: value }`.",
			],
		},
		preferObjectSpread: {
			primary:
				"`Object.assign()` with an object literal as the first argument can be replaced with object spread syntax.",
			secondary: [
				"Object spread syntax (`{ ...source }`) is more concise and readable than `Object.assign({}, source)`.",
				"Spread syntax was introduced in ES2018 and is widely supported in modern JavaScript environments.",
				"Using spread syntax makes object cloning and merging more idiomatic.",
			],
			suggestions: [
				"Replace `Object.assign({}, source)` with `{ ...source }`.",
				"Replace `Object.assign({ prop: value }, source)` with `{ prop: value, ...source }`.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression: (node, { sourceFile, typeChecker }) => {
					if (
						!isObjectAssignCall(node, typeChecker) ||
						node.arguments.length < 1
					) {
						return;
					}

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const firstArgument = node.arguments[0]!;

					if (
						firstArgument.kind !== SyntaxKind.ObjectLiteralExpression ||
						hasArraySpread(node) ||
						hasArgumentsWithAccessors(node)
					) {
						return;
					}

					context.report({
						message:
							node.arguments.length === 1
								? "preferObjectLiteral"
								: "preferObjectSpread",
						range: getTSNodeRange(node, sourceFile),
					});
				},
			},
		};
	},
});
