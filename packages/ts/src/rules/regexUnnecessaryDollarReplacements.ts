import { visitRegExpAST } from "@eslint-community/regexpp";
import type { AST as RegExpAST } from "@eslint-community/regexpp";
import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";
import { getConstrainedTypeAtLocation } from "./utils/getConstrainedType.ts";
import { parseRegexpAst } from "./utils/parseRegexpAst.ts";

interface ReplacementToken {
	end: number;
	kind: "named" | "numeric";
	raw: string;
	reference: number | string;
	start: number;
}

function getGroupInfo(regexpAst: RegExpAST.Pattern) {
	let count = 0;
	const names = new Set<string>();

	visitRegExpAST(regexpAst, {
		onCapturingGroupEnter(group) {
			count++;
			if (group.name) {
				names.add(group.name);
			}
		},
	});

	return { count, names };
}

function getRegexPatternAndFlags(node: AST.Expression) {
	if (node.kind !== ts.SyntaxKind.RegularExpressionLiteral) {
		return undefined;
	}

	const match = /^\/(.+)\/([dgimsuyv]*)$/.exec(node.text);
	if (!match) {
		return undefined;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	return { flags: match[2]!, pattern: match[1]! };
}

function parseReplacementTokens(text: string) {
	const tokens: ReplacementToken[] = [];

	for (let i = 0; i < text.length; i++) {
		if (text[i] !== "$") {
			continue;
		}

		const next = text[i + 1];
		if (!next) {
			continue;
		}

		// Skip escapes: $$, $&, $`, $'
		if (next === "$" || next === "&" || next === "`" || next === "'") {
			i++;
			continue;
		}

		// Named: $<name>
		if (next === "<") {
			const close = text.indexOf(">", i + 2);
			if (close === -1) {
				continue;
			}

			const name = text.slice(i + 2, close);
			tokens.push({
				end: close + 1,
				kind: "named",
				raw: text.slice(i, close + 1),
				reference: name,
				start: i,
			});
			i = close;
			continue;
		}

		// Numeric: $1-$9, $01-$99
		if (next >= "1" && next <= "9") {
			const secondDigit = text[i + 2];
			if (secondDigit && secondDigit >= "0" && secondDigit <= "9") {
				tokens.push({
					end: i + 3,
					kind: "numeric",
					raw: text.slice(i, i + 3),
					reference: parseInt(next + secondDigit, 10),
					start: i,
				});
				i += 2;
			} else {
				tokens.push({
					end: i + 2,
					kind: "numeric",
					raw: text.slice(i, i + 2),
					reference: parseInt(next, 10),
					start: i,
				});
				i++;
			}
		}
	}

	return tokens;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports replacement string references to capturing groups that do not exist in the pattern.",
		id: "regexUnnecessaryDollarReplacements",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		namedNotFound: {
			primary:
				"This replacement `{{ found }}` refers to a named capturing group that does not exist.",
			secondary: [
				"There is no capturing group named `{{ reference }}` in the pattern.",
			],
			suggestions: [
				"Correct the capturing group name.",
				"Escape the dollar sign with `$$`.",
			],
		},
		numericNotFound: {
			primary:
				"This replacement `{{ found }}` refers to a capturing group that does not exist.",
			secondary: [
				"The pattern only has {{ count }} capturing group(s), but `{{ found }}` references group {{ reference }}.",
			],
			suggestions: [
				"Correct the capturing group index.",
				"Escape the dollar sign with `$$`.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression: (node, { sourceFile, typeChecker }) => {
					if (
						!ts.isPropertyAccessExpression(node.expression) ||
						(node.expression.name.text !== "replace" &&
							node.expression.name.text !== "replaceAll") ||
						node.arguments.length < 2
					) {
						return;
					}

					const objectType = getConstrainedTypeAtLocation(
						node.expression.expression,
						typeChecker,
					);
					if (!(objectType.flags & ts.TypeFlags.StringLike)) {
						return;
					}

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const regexArgument = node.arguments[0]!;
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const replacementArgument = node.arguments[1]!;

					if (!ts.isStringLiteral(replacementArgument)) {
						return;
					}

					const regexInfo = getRegexPatternAndFlags(regexArgument);
					if (!regexInfo) {
						return;
					}

					const regexpAst = parseRegexpAst(regexInfo.pattern, regexInfo.flags);
					if (!regexpAst) {
						return;
					}

					const groupInfo = getGroupInfo(regexpAst);
					const tokens = parseReplacementTokens(replacementArgument.text);
					const replacementRange = getTSNodeRange(
						replacementArgument,
						sourceFile,
					);

					for (const token of tokens) {
						if (token.kind === "numeric") {
							const reference = token.reference as number;
							if (reference > groupInfo.count) {
								context.report({
									data: {
										count: groupInfo.count,
										found: token.raw,
										reference,
									},
									message: "numericNotFound",
									range: {
										begin: replacementRange.begin + 1 + token.start,
										end: replacementRange.begin + 1 + token.end,
									},
								});
							}
						} else {
							const reference = token.reference as string;
							if (!groupInfo.names.has(reference)) {
								context.report({
									data: {
										found: token.raw,
										reference,
									},
									message: "namedNotFound",
									range: {
										begin: replacementRange.begin + 1 + token.start,
										end: replacementRange.begin + 1 + token.end,
									},
								});
							}
						}
					}
				},
			},
		};
	},
});
