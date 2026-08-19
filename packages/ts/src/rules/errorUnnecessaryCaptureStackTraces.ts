import type ts from "typescript";

import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import typescript, {
	SyntaxKind,
} from "@flint.fyi/typescript-language/typescript";

import { ruleCreator } from "./ruleCreator.ts";
import { isErrorSubclass } from "./utils/isErrorSubclass.ts";

function isCaptureStackTraceCall(node: ts.Node): boolean {
	if (!typescript.isCallExpression(node) && !typescript.isOptionalChain(node)) {
		return false;
	}

	const callExpression = typescript.isCallExpression(node) ? node : undefined;
	if (!callExpression) {
		return typescript.isCallExpression(node) && isCaptureStackTraceCall(node);
	}

	return (
		typescript.isPropertyAccessExpression(callExpression.expression) &&
		typescript.isIdentifier(callExpression.expression.expression) &&
		callExpression.expression.expression.text === "Error" &&
		typescript.isIdentifier(callExpression.expression.name) &&
		callExpression.expression.name.text === "captureStackTrace"
	);
}

function isValidSecondArgument(
	node: ts.Expression,
	className: string | undefined,
): boolean {
	if (typescript.isIdentifier(node)) {
		return node.text === className;
	}

	if (
		typescript.isPropertyAccessExpression(node) &&
		node.expression.kind === SyntaxKind.ThisKeyword &&
		typescript.isIdentifier(node.name) &&
		node.name.text === "constructor"
	) {
		return true;
	}

	if (
		typescript.isMetaProperty(node) &&
		node.keywordToken === SyntaxKind.NewKeyword &&
		typescript.isIdentifier(node.name) &&
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
				ClassDeclaration: (node, { program, sourceFile, typeChecker }) => {
					if (!isErrorSubclass(node, typeChecker, program)) {
						return;
					}

					for (const member of node.members) {
						if (!typescript.isConstructorDeclaration(member) || !member.body) {
							continue;
						}

						for (const statement of member.body.statements) {
							if (
								statement.kind !== SyntaxKind.ExpressionStatement ||
								!(
									statement.expression.kind === SyntaxKind.CallExpression ||
									typescript.isCallChain(statement.expression)
								) ||
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
