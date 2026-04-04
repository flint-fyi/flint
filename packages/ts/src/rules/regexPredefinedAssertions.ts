import {
	type AST as RegExpAST,
	visitRegExpAST,
} from "@eslint-community/regexpp";
import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { parseRegexpAst } from "./utils/parseRegexpAst.ts";

function getPreferredAssertion(node: RegExpAST.LookaroundAssertion) {
	if (node.alternatives.length !== 1) {
		return undefined;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const elements = node.alternatives[0]!.elements;
	if (elements.length !== 1) {
		return undefined;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const element = elements[0]!;

	if (
		element.type !== "CharacterSet" ||
		element.kind === "any" ||
		element.kind === "digit" ||
		element.kind === "space" ||
		element.negate
	) {
		return undefined;
	}

	if (element.kind === "word") {
		if (node.kind === "lookahead" && !node.negate) {
			return "\\B";
		}

		if (node.kind === "lookahead" && node.negate) {
			return "\\b";
		}

		if (node.kind === "lookbehind" && !node.negate) {
			return "\\B";
		}

		if (node.kind === "lookbehind" && node.negate) {
			return "\\b";
		}
	}

	return undefined;
}

function isNegativeLookaheadDot(node: RegExpAST.Element) {
	if (node.type !== "Assertion" || node.kind !== "lookahead" || !node.negate) {
		return false;
	}

	if (node.alternatives.length !== 1) {
		return false;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const elements = node.alternatives[0]!.elements;
	if (elements.length !== 1) {
		return false;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const element = elements[0]!;

	return element.type === "CharacterSet" && element.kind === "any";
}

function isNegativeLookbehindDot(node: RegExpAST.Element) {
	if (node.type !== "Assertion" || node.kind !== "lookbehind" || !node.negate) {
		return false;
	}

	if (node.alternatives.length !== 1) {
		return false;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const elements = node.alternatives[0]!.elements;
	if (elements.length !== 1) {
		return false;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const element = elements[0]!;

	return element.type === "CharacterSet" && element.kind === "any";
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports regex lookarounds that can be replaced with predefined assertions.",
		id: "regexPredefinedAssertions",
		presets: ["stylistic"],
	},
	messages: {
		preferPredefinedAssertion: {
			primary:
				"Prefer the predefined assertion `{{ preferred }}` over the verbose lookaround `{{ found }}`.",
			secondary: [
				"Predefined assertions are more concise and communicate intent directly.",
			],
			suggestions: ["Replace `{{ found }}` with `{{ preferred }}`."],
		},
	},
	setup(context) {
		return {
			visitors: {
				RegularExpressionLiteral: (node, { sourceFile }) => {
					const match = /^\/(.+)\/([dgimsuyv]*)$/.exec(node.text);
					if (!match) {
						return;
					}

					const [, pattern, flagsStr] = match;
					if (!pattern) {
						return;
					}

					const regexpAst = parseRegexpAst(pattern, flagsStr);
					if (!regexpAst) {
						return;
					}

					const range = getTSNodeRange(node, sourceFile);

					if (regexpAst.alternatives.length === 1) {
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						const { elements } = regexpAst.alternatives[0]!;

						if (elements.length) {
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							const first = elements[0]!;

							if (isNegativeLookbehindDot(first)) {
								context.report({
									data: {
										found: first.raw,
										preferred: "^",
									},
									fix: {
										range: {
											begin: range.begin + 1 + first.start,
											end: range.begin + 1 + first.end,
										},
										text: "^",
									},
									message: "preferPredefinedAssertion",
									range: {
										begin: range.begin + 1 + first.start,
										end: range.begin + 1 + first.end,
									},
								});
							}

							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							const last = elements.at(-1)!;

							if (isNegativeLookaheadDot(last)) {
								context.report({
									data: {
										found: last.raw,
										preferred: "$",
									},
									fix: {
										range: {
											begin: range.begin + 1 + last.start,
											end: range.begin + 1 + last.end,
										},
										text: "$",
									},
									message: "preferPredefinedAssertion",
									range: {
										begin: range.begin + 1 + last.start,
										end: range.begin + 1 + last.end,
									},
								});
							}
						}
					}

					visitRegExpAST(regexpAst, {
						onAssertionEnter(assertionNode: RegExpAST.Assertion) {
							if (
								assertionNode.kind !== "lookahead" &&
								assertionNode.kind !== "lookbehind"
							) {
								return;
							}

							const preferred = getPreferredAssertion(assertionNode);
							if (!preferred) {
								return;
							}

							context.report({
								data: {
									found: assertionNode.raw,
									preferred,
								},
								fix: {
									range: {
										begin: range.begin + 1 + assertionNode.start,
										end: range.begin + 1 + assertionNode.end,
									},
									text: preferred,
								},
								message: "preferPredefinedAssertion",
								range: {
									begin: range.begin + 1 + assertionNode.start,
									end: range.begin + 1 + assertionNode.end,
								},
							});
						},
					});
				},
			},
		};
	},
});
