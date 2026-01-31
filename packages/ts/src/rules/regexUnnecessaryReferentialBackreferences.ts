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

type Backreference = RegExpAST.Backreference;
type CapturingGroup = RegExpAST.CapturingGroup;
type Node = RegExpAST.Node;

function containsNode(ancestor: Node, target: Node): boolean {
	if (ancestor === target) {
		return true;
	}

	switch (ancestor.type) {
		case "Alternative":
			return ancestor.elements.some((element) => containsNode(element, target));
		case "Assertion":
			if (ancestor.kind === "lookahead" || ancestor.kind === "lookbehind") {
				return ancestor.alternatives.some((alternative) =>
					containsNode(alternative, target),
				);
			}
			return false;
		case "CapturingGroup":
		case "Group":
		case "Pattern":
			return ancestor.alternatives.some((alternative) =>
				containsNode(alternative, target),
			);
		case "Quantifier":
			return containsNode(ancestor.element, target);
		default:
			return false;
	}
}

function getAncestors(node: Node): Node[] {
	const ancestors: Node[] = [];
	let current: Node | null = node.parent;
	while (current) {
		ancestors.push(current);
		current = current.parent;
	}
	return ancestors;
}

function groupCanOnlyMatchEmpty(group: CapturingGroup): boolean {
	return group.alternatives.every((alternative) =>
		alternative.elements.every((element) => {
			if (element.type === "Quantifier" && element.min === 0) {
				return true;
			}
			if (element.type === "Group" || element.type === "CapturingGroup") {
				return groupCanOnlyMatchEmpty(element as CapturingGroup);
			}
			if (element.type === "Assertion") {
				return true;
			}
			return false;
		}),
	);
}

function isBackreferenceAfterGroup(
	group: CapturingGroup,
	backreference: Backreference,
): boolean {
	const groupAncestors = getAncestors(group);
	const backrefAncestors = getAncestors(backreference);

	const commonAncestor = groupAncestors.find((ancestor) =>
		backrefAncestors.includes(ancestor),
	);
	if (commonAncestor?.type !== "Alternative") {
		return false;
	}

	const groupIndex = commonAncestor.elements.findIndex(
		(element) => containsNode(element, group) || element === group,
	);
	const backrefIndex = commonAncestor.elements.findIndex(
		(element) =>
			containsNode(element, backreference) || element === backreference,
	);

	return groupIndex < backrefIndex;
}

function isInsideLookahead(group: CapturingGroup): boolean {
	for (const ancestor of getAncestors(group)) {
		if (ancestor.type === "Assertion" && ancestor.kind === "lookahead") {
			return true;
		}
	}
	return false;
}

function mayBeUndefinedAtBackref(group: CapturingGroup): boolean {
	const groupAncestors = getAncestors(group);

	for (const ancestor of groupAncestors) {
		if (ancestor.type === "Quantifier" && ancestor.min === 0) {
			return true;
		}

		if (ancestor.type === "Alternative") {
			const parent = ancestor.parent;
			if (
				parent.type === "Group" ||
				parent.type === "CapturingGroup" ||
				parent.type === "Pattern"
			) {
				const alternativesContainingGroup = parent.alternatives.filter(
					(alternative) => containsNode(alternative, group),
				);
				if (alternativesContainingGroup.length < parent.alternatives.length) {
					return true;
				}
			}
		}

		if (ancestor.type === "Quantifier" && ancestor.max > 1) {
			const quantifiedElement = ancestor.element;
			if (
				quantifiedElement.type === "Group" ||
				quantifiedElement.type === "CapturingGroup"
			) {
				if (quantifiedElement === group) {
					continue;
				}
				const alternativesContainingGroup =
					quantifiedElement.alternatives.filter((alternative) =>
						containsNode(alternative, group),
					);
				if (
					alternativesContainingGroup.length <
					quantifiedElement.alternatives.length
				) {
					return true;
				}
			}
		}
	}

	return false;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports backreferences that may reference a capturing group that was not matched.",
		id: "regexUnnecessaryReferentialBackreferences",
		presets: ["logical"],
	},
	messages: {
		potentiallyUselessBackref: {
			primary:
				"Ensure capturing group is always matched before backreference `{{ raw }}`.",
			secondary: [
				"This backreference may always be empty because the referenced capturing group might not participate in the match.",
				"The group may be in an optional quantifier, inside an alternation where some branches don't include it, or reset in a loop.",
			],
			suggestions: [
				"Make sure the capturing group is always matched before the backreference.",
				"Consider restructuring the regex to ensure the group participates in the match.",
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
					const { resolved } = backreference;
					const groups = Array.isArray(resolved) ? resolved : [resolved];

					for (const group of groups) {
						if (
							groupCanOnlyMatchEmpty(group) ||
							isInsideLookahead(group) ||
							!isBackreferenceAfterGroup(group, backreference)
						) {
							continue;
						}

						if (mayBeUndefinedAtBackref(group)) {
							context.report({
								data: {
									raw: backreference.raw,
								},
								message: "potentiallyUselessBackref",
								range: {
									begin: patternStart + backreference.start,
									end: patternStart + backreference.end,
								},
							});
							return;
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
