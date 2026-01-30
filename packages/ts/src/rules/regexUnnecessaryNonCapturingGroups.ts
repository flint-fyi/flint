import {
	type AST as RegExpAST,
	visitRegExpAST,
} from "@eslint-community/regexpp";
import { typescriptLanguage } from "@flint.fyi/typescript-language";
import type {
	AST,
	TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { getRegExpConstruction } from "./utils/getRegExpConstruction.ts";
import { getRegExpLiteralDetails } from "./utils/getRegExpLiteralDetails.ts";
import { parseRegexpAst } from "./utils/parseRegexpAst.ts";

function canUnwrap(group: RegExpAST.Group, pattern: string): boolean {
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const alternative = group.alternatives[0]!;
	const groupContent = alternative.raw;

	if (!alternative.elements.length) {
		return true;
	}

	const parent = group.parent;
	let textBefore: string;
	let textAfter: string;

	if (parent.type === "Alternative") {
		textBefore = pattern.slice(parent.start, group.start);
		textAfter = pattern.slice(group.end, parent.end);
	} else {
		// parent.type === "Quantifier"
		const alt = parent.parent;
		textBefore = pattern.slice(alt.start, group.start);
		textAfter = pattern.slice(group.end, alt.end);
	}

	return (
		!mightCreateNewElement(textBefore, groupContent) &&
		!mightCreateNewElement(groupContent, textAfter)
	);
}

function isUnnecessaryGroup(group: RegExpAST.Group, pattern: string) {
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const firstAlternative = group.alternatives[0]!;

	if (group.alternatives.length === 1) {
		if (!firstAlternative.elements.length) {
			return false;
		}

		if (group.parent.type === "Quantifier") {
			if (firstAlternative.elements.length !== 1) {
				return false;
			}

			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const singleElement = firstAlternative.elements[0]!;

			if (
				singleElement.type === "Quantifier" ||
				singleElement.type === "Assertion"
			) {
				return false;
			}

			return canUnwrap(group, pattern);
		}

		return canUnwrap(group, pattern);
	}

	if (
		group.parent.type === "Quantifier" ||
		group.parent.elements.length !== 1
	) {
		return false;
	}

	return canUnwrap(group, pattern);
}

function mightCreateNewElement(before: string, after: string): boolean {
	// Control: \cA
	if (before.endsWith("\\c") && /^[a-z]/i.test(after)) {
		return true;
	}

	// Hexadecimal: \xFF \uFFFF
	if (
		/(?:^|[^\\])(?:\\{2})*\\(?:x[\dA-Fa-f]?|u[\dA-Fa-f]{0,3})$/.test(before) &&
		/^[\da-f]/i.test(after)
	) {
		return true;
	}

	// Unicode: \u{FFFF}
	if (
		(/(?:^|[^\\])(?:\\{2})*\\u$/.test(before) &&
			/^\{[\da-f]*(?:\}[\s\S]*)?$/i.test(after)) ||
		(/(?:^|[^\\])(?:\\{2})*\\u\{[\da-f]*$/.test(before) &&
			/^(?:[\da-f]+\}?|\})/i.test(after))
	) {
		return true;
	}

	// Octal: \077 \123
	if (
		(/(?:^|[^\\])(?:\\{2})*\\0[0-7]?$/.test(before) && /^[0-7]/.test(after)) ||
		(/(?:^|[^\\])(?:\\{2})*\\[1-7]$/.test(before) && /^[0-7]/.test(after))
	) {
		return true;
	}

	// Backreference: \12 \k<foo>
	if (
		(/(?:^|[^\\])(?:\\{2})*\\[1-9]\d*$/.test(before) && /^\d/.test(after)) ||
		(/(?:^|[^\\])(?:\\{2})*\\k$/.test(before) && after.startsWith("<")) ||
		/(?:^|[^\\])(?:\\{2})*\\k<[^<>]*$/.test(before)
	) {
		return true;
	}

	// Property: \p{L} \P{L}
	if (
		(/(?:^|[^\\])(?:\\{2})*\\p$/i.test(before) &&
			/^\{[\w=]*(?:\}[\s\S]*)?$/.test(after)) ||
		(/(?:^|[^\\])(?:\\{2})*\\p\{[\w=]*$/i.test(before) &&
			/^[\w=]+(?:\}[\s\S]*)?$|^\}/.test(after))
	) {
		return true;
	}

	// Quantifier: {1} {2,} {2,3}
	if (
		(/(?:^|[^\\])(?:\\{2})*\{\d*$/.test(before) && /^[\d,}]/.test(after)) ||
		(/(?:^|[^\\])(?:\\{2})*\{\d+,$/.test(before) &&
			/^(?:\d+(?:\}|$)|\})/.test(after)) ||
		(/(?:^|[^\\])(?:\\{2})*\{\d+,\d*$/.test(before) && after.startsWith("}"))
	) {
		return true;
	}

	return false;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports non-capturing groups that can be removed without changing the meaning of the regex.",
		id: "regexUnnecessaryNonCapturingGroups",
		presets: ["stylistic"],
	},
	messages: {
		unnecessaryGroup: {
			primary:
				"This non-capturing group can be removed without changing the regular expression's behavior.",
			secondary: [
				"Non-capturing groups are generally only necessary when changing search behavior based on the full group.",
				"This non-capturing group has no such logic, and so can be removed without changing the regex behavior.",
			],
			suggestions: ["Remove the group delimiters to inline the group."],
		},
	},
	setup(context) {
		function checkPattern(
			pattern: string,
			patternStart: number,
			flags: string,
		) {
			const regexpAst = parseRegexpAst(pattern, flags);
			if (!regexpAst) {
				return;
			}

			visitRegExpAST(regexpAst, {
				onGroupEnter(group) {
					if (isUnnecessaryGroup(group, pattern)) {
						const groupContent = group.raw.slice(3, -1);
						context.report({
							fix: {
								range: {
									begin: patternStart + group.start,
									end: patternStart + group.end,
								},
								text: groupContent,
							},
							message: "unnecessaryGroup",
							range: {
								begin: patternStart + group.start,
								end: patternStart + group.end,
							},
						});
					}
				},
			});
		}

		function checkRegexLiteral(
			node: AST.RegularExpressionLiteral,
			services: TypeScriptFileServices,
		) {
			const details = getRegExpLiteralDetails(node, services);
			checkPattern(details.pattern, details.start, details.flags);
		}

		function checkRegExpConstructor(
			node: AST.CallExpression | AST.NewExpression,
			services: TypeScriptFileServices,
		) {
			const construction = getRegExpConstruction(node, services);
			if (!construction) {
				return;
			}

			checkPattern(
				construction.pattern,
				construction.start + 1,
				construction.flags,
			);
		}

		return {
			visitors: {
				CallExpression: checkRegExpConstructor,
				NewExpression: checkRegExpConstructor,
				RegularExpressionLiteral: checkRegexLiteral,
			},
		};
	},
});
