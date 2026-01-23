import {
	type AST,
	type Checker,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

interface DollarIssue {
	end: number;
	start: number;
}

const replacementPattern =
	/\$(?:[$&'`]|\d{1,2}|<[^>]+>)|\$(?![$&'`\d])|.+?(?=\$|$)/gu;

function adjustPosition(
	_unescaped: string,
	escaped: string,
	unescapedPos: number,
) {
	let escapedIndex = 0;
	let unescapedIndex = 0;

	while (unescapedIndex < unescapedPos && escapedIndex < escaped.length) {
		if (escaped[escapedIndex] === "\\") {
			escapedIndex += 2;
		} else {
			escapedIndex += 1;
		}
		unescapedIndex += 1;
	}

	return escapedIndex;
}

function findUnescapedDollars(replacementString: string): DollarIssue[] {
	const issues: DollarIssue[] = [];
	let match: null | RegExpExecArray;

	replacementPattern.lastIndex = 0;
	while ((match = replacementPattern.exec(replacementString)) !== null) {
		const token = match[0];
		if (token === "$") {
			issues.push({
				end: match.index + 1,
				start: match.index,
			});
		}
	}

	return issues;
}

function isRegExpArgument(argument: AST.Expression, typeChecker: Checker) {
	if (argument.kind === ts.SyntaxKind.RegularExpressionLiteral) {
		return true;
	}

	if (
		argument.kind === ts.SyntaxKind.NewExpression ||
		argument.kind === ts.SyntaxKind.CallExpression
	) {
		const callOrNew = argument;
		if (
			callOrNew.expression.kind === ts.SyntaxKind.Identifier &&
			callOrNew.expression.text === "RegExp"
		) {
			return true;
		}
	}

	const type = typeChecker.getTypeAtLocation(argument);
	const symbol = type.getSymbol();
	return symbol?.getName() === "RegExp";
}

function isStringType(node: AST.Expression, typeChecker: Checker) {
	const type = typeChecker.getTypeAtLocation(node);
	return (type.flags & ts.TypeFlags.StringLike) !== 0;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports replacement strings with unescaped `$` that should use `$$`.",
		id: "regexDollarEscapes",
		presets: ["stylistic"],
	},
	messages: {
		unescapedDollar: {
			primary:
				"This unescaped `$` is an invalid substitution pattern matcher. Use `$$` to represent a literal `$` in replacement strings.",
			secondary: [
				"In `String.prototype.replace()` and `String.prototype.replaceAll()`, `$` is a special character used for substitution patterns like `$&`, `$1`, etc.",
				"To include a literal `$` in the replacement, escape it as `$$`.",
			],
			suggestions: [
				"Escape the `$` as `$$` if it is meant to be output as a `$`.",
				"Correct the substitution pattern if it is meant to be used as one.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression: (node, { sourceFile, typeChecker }) => {
					if (node.expression.kind !== ts.SyntaxKind.PropertyAccessExpression) {
						return;
					}

					const propertyAccess = node.expression;
					const methodName = propertyAccess.name.text;

					if (methodName !== "replace" && methodName !== "replaceAll") {
						return;
					}

					const args = node.arguments;
					if (args.length < 2) {
						return;
					}

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const regexpArgument = args[0]!;
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const stringLiteral = args[1]!;

					if (
						!isRegExpArgument(regexpArgument, typeChecker) ||
						!isStringType(propertyAccess.expression, typeChecker) ||
						stringLiteral.kind !== ts.SyntaxKind.StringLiteral
					) {
						return;
					}

					const replacementValue = stringLiteral.text;
					const issues = findUnescapedDollars(replacementValue);

					if (issues.length === 0) {
						return;
					}

					const stringStart = stringLiteral.getStart(sourceFile);
					const rawText = stringLiteral.getText(sourceFile);
					const quote = rawText[0];

					for (const issue of issues) {
						const adjustedStart = adjustPosition(
							replacementValue,
							rawText.slice(1, -1),
							issue.start,
						);
						const adjustedEnd = adjustPosition(
							replacementValue,
							rawText.slice(1, -1),
							issue.end,
						);

						const reportStart = stringStart + 1 + adjustedStart;
						const reportEnd = stringStart + 1 + adjustedEnd;

						context.report({
							fix: {
								range: { begin: reportStart, end: reportEnd },
								text: quote === "`" ? "\\$\\$" : "$$",
							},
							message: "unescapedDollar",
							range: {
								begin: reportStart,
								end: reportEnd,
							},
						});
					}
				},
			},
		};
	},
});
