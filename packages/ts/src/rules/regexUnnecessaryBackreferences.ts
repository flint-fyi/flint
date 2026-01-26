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

type UselessReason =
	| "backward"
	| "disjunctive"
	| "forward"
	| "intoNegativeLookaround"
	| "nested";

function getMatchingDirectionFromPath(path: RegExpAST.Node[]) {
	return path.some(isLookbehind) ? "rtl" : "ltr";
}

function getPathToRoot(node: RegExpAST.Node) {
	const path: RegExpAST.Node[] = [];
	for (
		let current: null | RegExpAST.Node = node;
		current;
		current = current.parent
	) {
		path.push(current);
	}
	return path;
}

function getUselessProblem(
	backreference: RegExpAST.Backreference,
	group: RegExpAST.CapturingGroup,
): undefined | UselessReason {
	const backrefPath = getPathToRoot(backreference);
	const groupPath = getPathToRoot(group);

	if (backrefPath.includes(group)) {
		return "nested";
	}

	const backrefPathSet = new Set(backrefPath);
	let commonAncestor: RegExpAST.Node | undefined;
	let groupCut: RegExpAST.Node[] = [];
	for (let i = 0; i < groupPath.length; i++) {
		const node = groupPath[i];
		if (node && backrefPathSet.has(node)) {
			commonAncestor = node;
			groupCut = groupPath.slice(0, i);
			break;
		}
	}

	if (commonAncestor) {
		const backrefCut = backrefPath.slice(
			0,
			backrefPath.indexOf(commonAncestor),
		);
		if (backrefCut.length > 0 && groupCut.length > 0) {
			const backrefChild = backrefCut[backrefCut.length - 1];
			const groupChild = groupCut[groupCut.length - 1];
			if (
				backrefChild?.type === "Alternative" &&
				groupChild?.type === "Alternative" &&
				backrefChild !== groupChild
			) {
				return "disjunctive";
			}
		}
	}

	if (groupCut.some(isNegativeLookaround)) {
		return "intoNegativeLookaround";
	}

	const direction = getMatchingDirectionFromPath(backrefPath);
	if (direction === "ltr") {
		if (backreference.end <= group.start) {
			return "forward";
		}
	} else {
		if (group.end <= backreference.start) {
			return "backward";
		}
	}

	return undefined;
}

function isLookbehind(
	node: RegExpAST.Node,
): node is RegExpAST.LookaroundAssertion {
	return node.type === "Assertion" && node.kind === "lookbehind";
}

function isNegativeLookaround(
	node: RegExpAST.Node,
): node is RegExpAST.LookaroundAssertion {
	return (
		node.type === "Assertion" &&
		(node.kind === "lookahead" || node.kind === "lookbehind") &&
		node.negate
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports backreferences in regular expressions that will always match empty or fail.",
		id: "regexUnnecessaryBackreferences",
		presets: ["logical"],
	},
	messages: {
		backward: {
			primary:
				"Backreference '{{ backreference }}' will be ignored because it appears after the group '{{ group }}' in a lookbehind.",
			secondary: [
				"In lookbehind assertions, matching proceeds right-to-left, so this backreference is evaluated before the group.",
			],
		},
		disjunctive: {
			primary:
				"Backreference '{{ backreference }}' will be ignored because it and the group '{{ group }}' are in different alternatives.",
			secondary: [
				"When this backreference is evaluated, the referenced group has not participated in the match.",
			],
		},
		forward: {
			primary:
				"Backreference '{{ backreference }}' will be ignored because it appears before the group '{{ group }}' is defined.",
			secondary: [
				"A forward reference to a group that hasn't been matched yet will always match empty.",
			],
		},
		intoNegativeLookaround: {
			primary:
				"Backreference '{{ backreference }}' will be ignored because the group '{{ group }}' is in a negative lookaround.",
			secondary: [
				"When a negative lookaround succeeds, the groups inside it have not matched anything.",
			],
		},
		nested: {
			primary:
				"Backreference '{{ backreference }}' will be ignored because it is inside the group it references.",
			secondary: [
				"A backreference inside its own group will always match empty since the group hasn't finished capturing yet.",
			],
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
				onBackreferenceEnter(backreference) {
					const resolved = backreference.resolved;
					const groups = Array.isArray(resolved) ? resolved : [resolved];

					for (const group of groups) {
						const problem = getUselessProblem(backreference, group);
						if (problem) {
							context.report({
								data: {
									backreference: backreference.raw,
									group: group.raw,
								},
								message: problem,
								range: {
									begin: patternStart + backreference.start,
									end: patternStart + backreference.end,
								},
							});
							break;
						}
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
				construction.raw,
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
