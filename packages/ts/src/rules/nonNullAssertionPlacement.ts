import { typescriptLanguage } from "@flint.fyi/typescript-language";
import { type Expression, type SourceFile, SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function endsWithNonNullAssertion(node: Expression, sourceFile: SourceFile) {
	return node.getLastToken(sourceFile)?.kind === SyntaxKind.ExclamationToken;
}

const confusingOperatorTexts = new Map([
	[SyntaxKind.EqualsEqualsEqualsToken, "==="],
	[SyntaxKind.EqualsEqualsToken, "=="],
	[SyntaxKind.EqualsToken, "="],
	[SyntaxKind.InKeyword, "in"],
	[SyntaxKind.InstanceOfKeyword, "instanceof"],
]);

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports confusing placement of non-null assertions next to comparison or assignment operators.",
		id: "nonNullAssertionPlacement",
		presets: ["stylisticStrict"],
	},
	messages: {
		confusingAssign: {
			primary:
				"Non-null assertion before assignment (`a! = b`) looks similar to not-equals (`a != b`).",
			secondary: [
				"This placement creates visual confusion between the assignment `=` and the not-equals operator `!=`.",
				"Moving the non-null assertion or wrapping the left side in parentheses makes the intent clearer.",
			],
			suggestions: [
				"Remove the non-null assertion if it's unnecessary.",
				"Wrap the left-hand side in parentheses to clarify intent.",
			],
		},
		confusingEqual: {
			primary:
				"Non-null assertion before equality test (`a! == b`) looks similar to strict not-equals (`a !== b`).",
			secondary: [
				"This placement creates visual confusion between the equality operators and the not-equals operators.",
				"Moving the non-null assertion or wrapping the left side in parentheses makes the intent clearer.",
			],
			suggestions: [
				"Remove the non-null assertion if it's unnecessary.",
				"Wrap the left-hand side in parentheses to clarify intent.",
			],
		},
		confusingOperator: {
			primary:
				"Non-null assertion before `{{ operator }}` operator (`a! {{ operator }} b`) might be misread as `!(a {{ operator }} b)`.",
			secondary: [
				"This placement creates visual confusion that could suggest the entire expression is being negated.",
				"Moving the non-null assertion or wrapping the left side in parentheses makes the intent clearer.",
			],
			suggestions: [
				"Remove the non-null assertion if it's unnecessary.",
				"Wrap the left-hand side in parentheses to clarify intent.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				BinaryExpression: (node, { sourceFile }) => {
					const operatorText = confusingOperatorTexts.get(
						node.operatorToken.kind,
					);
					if (
						!operatorText ||
						!endsWithNonNullAssertion(node.left, sourceFile)
					) {
						return;
					}

					const range = {
						begin: node.left.end - 1,
						end: node.left.end,
					};

					const leftText = node.left.getText(sourceFile);
					const innerExpression =
						node.left.kind === SyntaxKind.NonNullExpression &&
						node.left.expression;

					const suggestions = [
						...(innerExpression
							? [
									{
										id: "removeAssertion",
										range: {
											begin: node.left.getStart(sourceFile),
											end: node.left.end,
										},
										text: innerExpression.getText(sourceFile),
									},
								]
							: []),
						{
							id: "wrapInParentheses",
							range: {
								begin: node.left.getStart(sourceFile),
								end: node.left.end,
							},
							text: `(${leftText})`,
						},
					];

					switch (node.operatorToken.kind) {
						case SyntaxKind.EqualsToken:
							context.report({
								message: "confusingAssign",
								range,
								suggestions,
							});
							break;

						case SyntaxKind.InKeyword:
						case SyntaxKind.InstanceOfKeyword:
							context.report({
								data: { operator: operatorText },
								message: "confusingOperator",
								range,
								suggestions,
							});
							break;

						default:
							context.report({
								message: "confusingEqual",
								range,
								suggestions,
							});
							break;
					}
				},
			},
		};
	},
});
