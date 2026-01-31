import {
	type AST as RegExpAST,
	RegExpParser,
	visitRegExpAST,
} from "@eslint-community/regexpp";
import type { MessageForContext } from "@flint.fyi/core";
import { typescriptLanguage } from "@flint.fyi/typescript-language";
import type {
	AST,
	TypeScriptFileServices,
} from "@flint.fyi/typescript-language";
import { toUnicodeSet } from "regexp-ast-analysis";

import { ruleCreator } from "./ruleCreator.ts";
import { getRegExpConstruction } from "./utils/getRegExpConstruction.ts";
import { getRegExpLiteralDetails } from "./utils/getRegExpLiteralDetails.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports unnecessary operands in regular expression character class set operations.",
		id: "regexUnnecessarySetOperands",
		presets: ["logical"],
	},
	messages: {
		intersectionDisjoint: {
			primary:
				"This operation can be simplified: '{{ left }}' and '{{ right }}' are disjoint, so the result is always empty.",
			secondary: [
				"When two sets have no common elements, their intersection is empty.",
				"This likely indicates a mistake in the regular expression.",
			],
			suggestions: [
				"Review the operands to ensure they share common elements.",
				"Remove the expression if the empty result is intentional.",
			],
		},
		intersectionSubset: {
			primary:
				"This operation can be simplified: '{{ subset }}' is a subset of '{{ superset }}', so the superset operand is redundant.",
			secondary: [
				"When one operand is a subset of another in an intersection, the superset is redundant.",
				"The result is equivalent to just the subset operand.",
			],
			suggestions: ["Remove the redundant superset operand."],
		},
		subtractionDisjoint: {
			primary:
				"This operation can be simplified: '{{ left }}' and '{{ right }}' are disjoint, so the subtraction has no effect.",
			secondary: [
				"Subtracting a set that shares no elements with the left operand does nothing.",
				"The right operand can be safely removed.",
			],
			suggestions: [
				"Remove the unnecessary right operand.",
				"Review the operands to ensure the subtraction is meaningful.",
			],
		},
		subtractionSubset: {
			primary:
				"This operation can be simplified: '{{ left }}' is a subset of '{{ right }}', so the result is always empty.",
			secondary: [
				"When you subtract a set that contains all elements of the left operand, the result is empty.",
				"This likely indicates a mistake in the regular expression.",
			],
			suggestions: [
				"Review the operands to ensure this is intentional.",
				"Consider using a different pattern if the empty result is unintended.",
			],
		},
	},
	setup(context) {
		const unicodeSetsFlags = { unicode: false, unicodeSets: true };

		function unwrapBrackets(raw: string): string {
			if (raw.startsWith("[") && raw.endsWith("]")) {
				return raw.slice(1, -1);
			}
			return raw;
		}

		function report(
			node: RegExpAST.ClassIntersection | RegExpAST.ClassSubtraction,
			patternStart: number,
			canFix: boolean,
			message: MessageForContext<typeof context>,
			data: Record<string, string>,
			fixText?: string,
		) {
			const range = {
				begin: patternStart + node.start,
				end: patternStart + node.end,
			};
			context.report({
				data,
				fix: canFix && fixText ? { range, text: fixText } : undefined,
				message,
				range,
			});
		}

		function checkIntersection(
			node: RegExpAST.ClassIntersection,
			patternStart: number,
			canFix: boolean,
		) {
			const leftSet = toUnicodeSet(node.left, unicodeSetsFlags);
			const rightSet = toUnicodeSet(node.right, unicodeSetsFlags);

			if (leftSet.isDisjointWith(rightSet)) {
				report(
					node,
					patternStart,
					canFix,
					"intersectionDisjoint",
					{ left: node.left.raw, right: node.right.raw },
					"^^",
				);
				return;
			}

			if (leftSet.isSubsetOf(rightSet)) {
				report(
					node,
					patternStart,
					canFix,
					"intersectionSubset",
					{ subset: node.left.raw, superset: node.right.raw },
					unwrapBrackets(node.left.raw),
				);
				return;
			}

			if (rightSet.isSubsetOf(leftSet)) {
				report(
					node,
					patternStart,
					canFix,
					"intersectionSubset",
					{ subset: node.right.raw, superset: node.left.raw },
					unwrapBrackets(node.right.raw),
				);
			}
		}

		function checkSubtraction(
			node: RegExpAST.ClassSubtraction,
			patternStart: number,
			canFix: boolean,
		) {
			const leftSet = toUnicodeSet(node.left, unicodeSetsFlags);
			const rightSet = toUnicodeSet(node.right, unicodeSetsFlags);

			if (leftSet.isDisjointWith(rightSet)) {
				report(
					node,
					patternStart,
					canFix,
					"subtractionDisjoint",
					{ left: node.left.raw, right: node.right.raw },
					unwrapBrackets(node.left.raw),
				);
				return;
			}

			if (leftSet.isSubsetOf(rightSet)) {
				report(
					node,
					patternStart,
					canFix,
					"subtractionSubset",
					{ left: node.left.raw, right: node.right.raw },
					"^^",
				);
			}
		}

		function checkPattern(
			pattern: string,
			patternStart: number,
			canFix: boolean,
		) {
			let regexpAst: RegExpAST.Pattern | undefined;
			try {
				regexpAst = new RegExpParser().parsePattern(
					pattern,
					undefined,
					undefined,
					{ unicode: false, unicodeSets: true },
				);
			} catch {
				return;
			}

			visitRegExpAST(regexpAst, {
				onClassIntersectionEnter(node) {
					checkIntersection(node, patternStart, canFix);
				},
				onClassSubtractionEnter(node) {
					checkSubtraction(node, patternStart, canFix);
				},
			});
		}

		function checkRegexLiteral(
			node: AST.RegularExpressionLiteral,
			services: TypeScriptFileServices,
		) {
			const details = getRegExpLiteralDetails(node, services);
			if (!details.flags.includes("v")) {
				return;
			}

			checkPattern(details.pattern, details.start, true);
		}

		function checkRegExpConstructor(
			node: AST.CallExpression | AST.NewExpression,
			services: TypeScriptFileServices,
		) {
			const construction = getRegExpConstruction(node, services);
			if (!construction?.flags.includes("v")) {
				return;
			}

			checkPattern(construction.raw, construction.start + 1, false);
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
