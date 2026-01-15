import {
	type AST,
	type Checker,
	getTSNodeRange,
	hasSameTokens,
	isGlobalDeclarationOfName,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts, { SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";
import { skipParentheses } from "./utils/skipParentheses.ts";

function checkLogDivideConstant(
	node: AST.BinaryExpression,
	typeChecker: Checker,
	constantName: string,
	replacementMethod: string,
) {
	if (node.operatorToken.kind !== SyntaxKind.SlashToken) {
		return;
	}

	const left = skipParentheses(node.left);
	const right = skipParentheses(node.right);

	if (
		getMathMethodArgument(left, "log", typeChecker) &&
		isMathProperty(right, constantName, typeChecker)
	) {
		return {
			description: `Math.log(…) / Math.${constantName}`,
			replacement: `Math.${replacementMethod}(…)`,
		};
	}
}

function checkLogTimesConstant(
	node: AST.BinaryExpression,
	typeChecker: Checker,
	constantName: string,
	replacementMethod: string,
) {
	if (node.operatorToken.kind !== SyntaxKind.AsteriskToken) {
		return;
	}

	const left = skipParentheses(node.left);
	const right = skipParentheses(node.right);

	if (
		getMathMethodArgument(left, "log", typeChecker) &&
		isMathProperty(right, constantName, typeChecker)
	) {
		return {
			description: `Math.log(…) * Math.${constantName}`,
			replacement: `Math.${replacementMethod}(…)`,
		};
	}

	if (
		isMathProperty(left, constantName, typeChecker) &&
		getMathMethodArgument(right, "log", typeChecker)
	) {
		return {
			description: `Math.${constantName} * Math.log(…)`,
			replacement: `Math.${replacementMethod}(…)`,
		};
	}
}

function flattenPlusExpression(node: AST.Expression): AST.Expression[] {
	const unwrapped = skipParentheses(node);

	if (
		unwrapped.kind === SyntaxKind.BinaryExpression &&
		unwrapped.operatorToken.kind === SyntaxKind.PlusToken
	) {
		return [
			...flattenPlusExpression(unwrapped.left),
			...flattenPlusExpression(unwrapped.right),
		];
	}

	return [unwrapped];
}

function getMathMethodArgument(
	node: AST.Expression,
	methodName: string,
	typeChecker: Checker,
) {
	if (
		node.kind !== SyntaxKind.CallExpression ||
		node.questionDotToken ||
		node.arguments.length !== 1
	) {
		return false;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const argument = node.arguments[0]!;

	if (
		argument.kind === SyntaxKind.SpreadElement ||
		!isMathProperty(node.expression, methodName, typeChecker)
	) {
		return undefined;
	}

	return argument;
}

function isMathProperty(
	node: AST.Expression,
	propertyName: string,
	typeChecker: Checker,
) {
	return (
		node.kind === SyntaxKind.PropertyAccessExpression &&
		!node.questionDotToken &&
		node.name.kind === SyntaxKind.Identifier &&
		node.name.text === propertyName &&
		node.expression.kind === SyntaxKind.Identifier &&
		isGlobalDeclarationOfName(node.expression, "Math", typeChecker)
	);
}

function isPowerTwoExpression(
	node: AST.Expression,
	sourceFile: ts.SourceFile,
): boolean {
	const unwrapped = skipParentheses(node);

	if (unwrapped.kind !== SyntaxKind.BinaryExpression) {
		return false;
	}

	if (unwrapped.operatorToken.kind === SyntaxKind.AsteriskToken) {
		return hasSameTokens(unwrapped.left, unwrapped.right, sourceFile);
	}

	if (unwrapped.operatorToken.kind === SyntaxKind.AsteriskAsteriskToken) {
		const right = skipParentheses(unwrapped.right);
		return right.kind === SyntaxKind.NumericLiteral && right.text === "2";
	}

	return false;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Prefer modern Math methods over legacy patterns.",
		id: "mathMethods",
		presets: ["stylisticStrict"],
	},
	messages: {
		preferModernMath: {
			primary: "Prefer `{{replacement}}` over `{{description}}`.",
			secondary: [
				"Modern Math methods are clearer and more explicit about their purpose.",
				"These methods have been available since ES2015 and are well-supported in all modern environments.",
			],
			suggestions: ["Replace the legacy pattern with the modern Math method."],
		},
	},
	setup(context) {
		return {
			visitors: {
				BinaryExpression: (node, { sourceFile, typeChecker }) => {
					const logPatterns = [
						{ constantName: "LOG10E", replacementMethod: "log10" },
						{ constantName: "LOG2E", replacementMethod: "log2" },
					];

					for (const { constantName, replacementMethod } of logPatterns) {
						const match = checkLogTimesConstant(
							node,
							typeChecker,
							constantName,
							replacementMethod,
						);
						if (match) {
							context.report({
								data: {
									description: match.description,
									replacement: match.replacement,
								},
								message: "preferModernMath",
								range: getTSNodeRange(node, sourceFile),
							});
							return;
						}
					}

					const lnPatterns = [
						{ constantName: "LN10", replacementMethod: "log10" },
						{ constantName: "LN2", replacementMethod: "log2" },
					];

					for (const { constantName, replacementMethod } of lnPatterns) {
						const match = checkLogDivideConstant(
							node,
							typeChecker,
							constantName,
							replacementMethod,
						);
						if (match) {
							context.report({
								data: {
									description: match.description,
									replacement: match.replacement,
								},
								message: "preferModernMath",
								range: getTSNodeRange(node, sourceFile),
							});
							return;
						}
					}
				},
				CallExpression: (node, { sourceFile, typeChecker }) => {
					const argument = getMathMethodArgument(node, "sqrt", typeChecker);
					if (!argument) {
						return;
					}

					const expressions = flattenPlusExpression(argument);

					if (
						!expressions.every((expr) => isPowerTwoExpression(expr, sourceFile))
					) {
						return;
					}

					const replacementMethod = expressions.length === 1 ? "abs" : "hypot";

					context.report({
						data: {
							description: "Math.sqrt(…)",
							replacement: `Math.${replacementMethod}(…)`,
						},
						message: "preferModernMath",
						range: getTSNodeRange(node, sourceFile),
					});
				},
			},
		};
	},
});
