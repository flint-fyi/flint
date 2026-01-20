import { typescriptLanguage } from "@flint.fyi/typescript-language";
import { SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

const confusingOperators = new Set([
	SyntaxKind.EqualsEqualsEqualsToken,
	SyntaxKind.EqualsEqualsToken,
	SyntaxKind.EqualsToken,
	SyntaxKind.InKeyword,
	SyntaxKind.InstanceOfKeyword,
]);

function endsWithNonNullAssertion(
	sourceText: string,
	nodeEnd: number,
	operatorStart: number,
) {
	let position = nodeEnd;
	while (position < operatorStart) {
		const char = sourceText[position];
		if (char === ")") {
			return false;
		}

		position++;
	}

	return sourceText[nodeEnd - 1] === "!";
}

function getOperatorText(kind: SyntaxKind) {
	switch (kind) {
		case SyntaxKind.EqualsEqualsEqualsToken:
			return "===";
		case SyntaxKind.EqualsEqualsToken:
			return "==";
		case SyntaxKind.EqualsToken:
			return "=";
		case SyntaxKind.InKeyword:
			return "in";
		case SyntaxKind.InstanceOfKeyword:
			return "instanceof";
	}
}

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
					const operatorKind = node.operatorToken.kind;

					if (!confusingOperators.has(operatorKind)) {
						return;
					}

					const sourceText = sourceFile.getFullText();
					const operatorStart = node.operatorToken.getStart(sourceFile);

					if (
						!endsWithNonNullAssertion(sourceText, node.left.end, operatorStart)
					) {
						return;
					}

					const operatorText = getOperatorText(operatorKind);
					if (!operatorText) {
						return;
					}

					const exclamationEnd = node.left.end;
					const exclamationBegin = exclamationEnd - 1;

					const range = {
						begin: exclamationBegin,
						end: exclamationEnd,
					};

					if (
						operatorKind === SyntaxKind.InKeyword ||
						operatorKind === SyntaxKind.InstanceOfKeyword
					) {
						context.report({
							data: { operator: operatorText },
							message: "confusingOperator",
							range,
						});
						return;
					}

					if (operatorKind === SyntaxKind.EqualsToken) {
						context.report({
							message: "confusingAssign",
							range,
						});
						return;
					}

					context.report({
						message: "confusingEqual",
						range,
					});
				},
			},
		};
	},
});
