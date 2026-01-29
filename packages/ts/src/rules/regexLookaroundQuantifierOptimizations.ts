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

function* extractInvalidQuantifiers(
	alternatives: RegExpAST.Alternative[],
	kind: "lookahead" | "lookbehind",
): IterableIterator<RegExpAST.Quantifier> {
	for (const { elements } of alternatives) {
		if (elements.length === 0) {
			continue;
		}

		const lastIndex = kind === "lookahead" ? elements.length - 1 : 0;

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const last = elements[lastIndex]!;

		switch (last.type) {
			case "Group":
				yield* extractInvalidQuantifiers(last.alternatives, kind);
				break;

			case "Quantifier":
				if (
					last.min !== last.max &&
					!hasCapturingGroupDescendant(last.element)
				) {
					yield last;
				}
				break;
		}
	}
}

function hasCapturingGroupDescendant(element: RegExpAST.Element): boolean {
	switch (element.type) {
		case "CapturingGroup":
			return true;

		case "Group": {
			for (const alternative of element.alternatives) {
				for (const child of alternative.elements) {
					if (hasCapturingGroupDescendant(child)) {
						return true;
					}
				}
			}
			return false;
		}

		case "Quantifier":
			return hasCapturingGroupDescendant(element.element);

		default:
			return false;
	}
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports non-constant quantifiers in lookaround assertions that could be simplified.",
		id: "regexLookaroundQuantifierOptimizations",
		presets: ["logical"],
	},
	messages: {
		remove: {
			primary:
				"Quantifier '{{ raw }}' at the {{ endOrStart }} of the {{ kind }} can be removed.",
			secondary: [
				"Non-constant quantifiers at the end of lookaheads or start of lookbehinds only match their minimum because the lookaround only checks for a match, not how much is matched.",
			],
			suggestions: ["Remove the quantifier."],
		},
		replace: {
			primary:
				"Quantifier '{{ raw }}' at the {{ endOrStart }} of the {{ kind }} can be replaced with '{{ replacer }}'.",
			secondary: [
				"Non-constant quantifiers at the end of lookaheads or start of lookbehinds only match their minimum because the lookaround only checks for a match, not how much is matched.",
			],
			suggestions: ["Replace the quantifier with the constant minimum."],
		},
	},
	setup(context) {
		function checkPattern(pattern: string, start: number, flags: string) {
			const regexpAst = parseRegexpAst(pattern, flags);
			if (!regexpAst) {
				return;
			}

			visitRegExpAST(regexpAst, {
				onAssertionEnter(assertionNode) {
					if (
						assertionNode.kind !== "lookahead" &&
						assertionNode.kind !== "lookbehind"
					) {
						return;
					}

					const endOrStart =
						assertionNode.kind === "lookahead" ? "end" : "start";
					const kind = assertionNode.negate
						? `negative ${assertionNode.kind}`
						: assertionNode.kind;

					for (const quantifier of extractInvalidQuantifiers(
						assertionNode.alternatives,
						assertionNode.kind,
					)) {
						const replacer =
							quantifier.min === 0
								? ""
								: quantifier.min === 1
									? quantifier.element.raw
									: `${quantifier.element.raw}{${quantifier.min}}`;

						context.report({
							data: {
								endOrStart,
								kind,
								raw: quantifier.raw,
								replacer,
							},
							message: quantifier.min === 0 ? "remove" : "replace",
							range: {
								begin: start + quantifier.start,
								end: start + quantifier.end,
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
			if (construction) {
				checkPattern(
					construction.pattern,
					construction.start + 1,
					construction.flags,
				);
			}
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
