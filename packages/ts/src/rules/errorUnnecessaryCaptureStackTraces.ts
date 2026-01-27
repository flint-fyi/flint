import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import { SyntaxKind } from "typescript";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";
import { isErrorSubclass } from "./utils/isErrorSubclass.ts";

function isCaptureStackTraceCall(node: ts.Node): boolean {
	if (!ts.isCallExpression(node) && !ts.isOptionalChain(node)) {
		return false;
	}

	const callExpression = ts.isCallExpression(node) ? node : undefined;
	if (!callExpression) {
		return ts.isCallExpression(node) && isCaptureStackTraceCall(node);
	}

	return (
		ts.isPropertyAccessExpression(callExpression.expression) &&
		ts.isIdentifier(callExpression.expression.expression) &&
		callExpression.expression.expression.text === "Error" &&
		ts.isIdentifier(callExpression.expression.name) &&
		callExpression.expression.name.text === "captureStackTrace"
	);
}

function isValidSecondArgument(
	node: ts.Expression,
	className: string | undefined,
): boolean {
	if (ts.isIdentifier(node)) {
		return node.text === className;
	}

	if (
		ts.isPropertyAccessExpression(node) &&
		node.expression.kind === SyntaxKind.ThisKeyword &&
		ts.isIdentifier(node.name) &&
		node.name.text === "constructor"
	) {
		return true;
	}

	if (
		ts.isMetaProperty(node) &&
		node.keywordToken === SyntaxKind.NewKeyword &&
		ts.isIdentifier(node.name) &&
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
				ClassDeclaration: (node, { sourceFile, typeChecker }) => {
					if (!isErrorSubclass(node, typeChecker)) {
						return;
					}

					for (const member of node.members) {
						if (!ts.isConstructorDeclaration(member) || !member.body) {
							continue;
						}

						for (const statement of member.body.statements) {
							if (
								!ts.isExpressionStatement(statement) ||
								!(
									ts.isCallExpression(statement.expression) ||
									ts.isCallChain(statement.expression)
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
