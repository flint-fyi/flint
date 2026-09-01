import { SyntaxKind } from "typescript-native/unstable/ast";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { isErrorSubclass } from "./utils/isErrorSubclass.ts";

function isCaptureStackTraceCall(node: AST.Node): boolean {
	if (node.kind !== SyntaxKind.CallExpression) {
		return false;
	}

	return (
		node.expression.kind === SyntaxKind.PropertyAccessExpression &&
		node.expression.expression.kind === SyntaxKind.Identifier &&
		node.expression.expression.text === "Error" &&
		node.expression.name.text === "captureStackTrace"
	);
}

function isValidSecondArgument(
	node: AST.Expression,
	className: string | undefined,
): boolean {
	if (node.kind === SyntaxKind.Identifier) {
		return node.text === className;
	}

	if (
		node.kind === SyntaxKind.PropertyAccessExpression &&
		node.expression.kind === SyntaxKind.ThisKeyword &&
		node.name.text === "constructor"
	) {
		return true;
	}

	if (
		node.kind === SyntaxKind.MetaProperty &&
		node.keywordToken === SyntaxKind.NewKeyword &&
		node.name.text === "target"
	) {
		return true;
	}

	return false;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports unnecessary Error.captureStackTrace() calls in Error subclass constructors.",
		id: "errorUnnecessaryCaptureStackTraces",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		unnecessaryCaptureStackTrace: {
			primary:
				"Calling `Error.captureStackTrace()` is unnecessary in built-in Error subclass constructors.",
			secondary: [
				"The `Error` constructor automatically calls `Error.captureStackTrace()` when extending built-in Error types.",
				"Calling it again is redundant and adds unnecessary code.",
			],
			suggestions: ["Remove the `Error.captureStackTrace()` call."],
		},
	},
	setup(context) {
		return {
			visitors: {
				ClassDeclaration: (node, { checker, program, sourceFile }) => {
					if (!isErrorSubclass(node, checker, program)) {
						return;
					}

					for (const member of node.members) {
						if (member.kind !== SyntaxKind.Constructor || !member.body) {
							continue;
						}

						for (const statement of member.body.statements) {
							if (
								statement.kind !== SyntaxKind.ExpressionStatement ||
								statement.expression.kind !== SyntaxKind.CallExpression ||
								!isCaptureStackTraceCall(statement.expression)
							) {
								continue;
							}

							const args = statement.expression.arguments;
							if (args.length < 1) {
								continue;
							}

							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							const firstArgument = args[0]!;
							if (firstArgument.kind !== SyntaxKind.ThisKeyword) {
								continue;
							}

							if (args.length >= 2) {
								// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
								const secondArgument = args[1]!;
								if (!isValidSecondArgument(secondArgument, node.name?.text)) {
									continue;
								}
							}

							context.report({
								message: "unnecessaryCaptureStackTrace",
								range: getTSNodeRange(statement, sourceFile),
							});
						}
					}
				},
			},
		};
	},
});
