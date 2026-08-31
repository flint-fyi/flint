import {
	isIdentifier,
	isPropertyAccessExpression,
	SyntaxKind,
} from "typescript-native/unstable/ast";

import {
	getTSNodeRange,
	isGlobalDeclaration,
	typescriptLanguage,
	type AST,
} from "@flint.fyi/typescript-language";
import { nullThrows } from "@flint.fyi/utils";

import { ruleCreator } from "./ruleCreator.ts";
import { isASTExpression } from "./typeGuards.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Prefer modern DOM append/prepend methods over appendChild/insertBefore.",
		id: "nodeAppendMethods",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		preferAppend: {
			primary: "`append()` is more modern and flexible than `{{ method }}()`.",
			secondary: [
				"The modern `append()` method is more flexible and readable.",
				"It accepts multiple nodes and strings, while the legacy method only accepts a single Node.",
			],
			suggestions: ["Use `append()` instead of `{{ method }}()`."],
		},
		preferPrepend: {
			primary: "`prepend()` is more modern and flexible than `insertBefore()`.",
			secondary: [
				"The modern `prepend()` method is more flexible and readable.",
				"It accepts multiple nodes and strings, while `insertBefore()` only accepts a single Node.",
			],
			suggestions: [
				"Use `prepend()` instead of `insertBefore()` when inserting at the beginning.",
			],
		},
	},
	setup(context) {
		function isFirstChildAccess(node: AST.Expression): boolean {
			return (
				isPropertyAccessExpression(node) &&
				isIdentifier(node.name) &&
				node.name.text === "firstChild"
			);
		}

		return {
			visitors: {
				CallExpression(node, { checker, program, sourceFile }) {
					if (
						!isPropertyAccessExpression(node.expression) ||
						!isIdentifier(node.expression.name) ||
						!isGlobalDeclaration(node.expression.name, checker, program)
					) {
						return;
					}

					switch (node.expression.name.text) {
						case "appendChild":
							context.report({
								data: { method: "appendChild" },
								message: "preferAppend",
								range: getTSNodeRange(node.expression.name, sourceFile),
							});
							break;

						case "insertBefore": {
							if (node.arguments.length < 2) {
								break;
							}

							const secondArgument = nullThrows(
								node.arguments[1],
								"Second argument is expected to be present by the length check",
							);
							if (
								secondArgument.kind !== SyntaxKind.NullKeyword &&
								(!isASTExpression(secondArgument) ||
									!isFirstChildAccess(secondArgument))
							) {
								break;
							}

							context.report({
								data:
									secondArgument.kind === SyntaxKind.NullKeyword
										? { method: "insertBefore" }
										: {},
								message:
									secondArgument.kind === SyntaxKind.NullKeyword
										? "preferAppend"
										: "preferPrepend",
								range: getTSNodeRange(node.expression.name, sourceFile),
							});
						}
					}
				},
			},
		};
	},
});
