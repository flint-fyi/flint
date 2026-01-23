import {
	type AST as RegExpAST,
	visitRegExpAST,
} from "@eslint-community/regexpp";
import { typescriptLanguage } from "@flint.fyi/typescript-language";
import type { AST } from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";
import { parseRegexpAst } from "./utils/parseRegexpAst.ts";

type QuantifierElement = RegExpAST.Quantifier;

function findFollowingElement(
	capturingGroup: RegExpAST.CapturingGroup,
): RegExpAST.Element | undefined {
	const parent = capturingGroup.parent;
	if (parent.type !== "Alternative") {
		return undefined;
	}

	const index = parent.elements.indexOf(capturingGroup);
	if (index < 0 || index >= parent.elements.length - 1) {
		return undefined;
	}

	return parent.elements[index + 1];
}

function findPrecedingQuantifier(
	capturingGroup: RegExpAST.CapturingGroup,
): QuantifierElement | undefined {
	const parent = capturingGroup.parent;
	if (parent.type !== "Alternative") {
		return undefined;
	}

	const index = parent.elements.indexOf(capturingGroup);
	if (index <= 0) {
		return undefined;
	}

	for (let i = index - 1; i >= 0; i--) {
		const element = parent.elements[i];
		if (!element) {
			continue;
		}
		if (element.type === "Quantifier" && element.max > element.min) {
			return element;
		}
	}

	return undefined;
}

function getEndQuantifier(
	capturingGroup: RegExpAST.CapturingGroup,
): QuantifierElement | undefined {
	for (const alt of capturingGroup.alternatives) {
		if (alt.elements.length === 0) {
			continue;
		}
		const last = alt.elements.at(-1);
		if (last?.type === "Quantifier" && last.max > last.min) {
			return last;
		}
	}
	return undefined;
}

function getMatchableCharacterTypes(element: RegExpAST.Element): Set<string> {
	const types = new Set<string>();

	switch (element.type) {
		case "CapturingGroup":
		case "Group":
			for (const alt of element.alternatives) {
				for (const child of alt.elements) {
					for (const type of getMatchableCharacterTypes(child)) {
						types.add(type);
					}
				}
			}
			break;
		case "Character":
			types.add(`char:${element.value}`);
			break;
		case "CharacterClass":
			for (const child of element.elements) {
				if (child.type === "Character") {
					types.add(`char:${child.value}`);
				} else if (child.type === "CharacterSet") {
					types.add(`set:${child.kind}`);
				} else if (child.type === "CharacterClassRange") {
					types.add(`range:${child.min.value}-${child.max.value}`);
				}
			}
			break;
		case "CharacterSet":
			types.add(`set:${element.kind}`);
			break;
		case "Quantifier":
			for (const type of getMatchableCharacterTypes(element.element)) {
				types.add(type);
			}
			break;
		default:
			break;
	}

	return types;
}

function getStartQuantifier(
	alternative: RegExpAST.Alternative,
	direction: "ltr" | "rtl",
): QuantifierElement | undefined {
	const elements = alternative.elements;
	if (elements.length === 0) {
		return undefined;
	}

	const first = direction === "ltr" ? elements[0] : elements.at(-1);
	if (!first) {
		return undefined;
	}

	if (first.type === "Quantifier") {
		return first;
	}

	if (first.type === "Group") {
		for (const alt of first.alternatives) {
			const quantifier = getStartQuantifier(alt, direction);
			if (quantifier) {
				return quantifier;
			}
		}
	}

	return undefined;
}

function hasOverlap(a: Set<string>, b: Set<string>): boolean {
	if (a.has("set:any") || b.has("set:any")) {
		return true;
	}

	for (const type of a) {
		if (b.has(type)) {
			return true;
		}
	}
	return false;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports capturing groups that capture less text than their pattern suggests.",
		id: "regexMisleadingCapturingGroups",
		presets: ["logical"],
	},
	messages: {
		misleadingEnd: {
			primary:
				"Quantifier '{{ quantifierRaw }}' at the end of capturing group may capture less than expected due to backtracking.",
			secondary: [
				"The quantifier at the end of this capturing group may give up characters during backtracking to satisfy a following pattern.",
			],
			suggestions: ["Consider using an atomic group or rewriting the pattern."],
		},
		misleadingStart: {
			primary:
				"Capturing group with '{{ captureRaw }}' will always capture {{ behavior }} because '{{ precedingRaw }}' consumes matching characters first.",
			secondary: [
				"The quantifier in this capturing group can never match as much as expected because a preceding quantifier already consumed the characters.",
			],
			suggestions: [
				"Consider removing or simplifying the quantifier in the capturing group.",
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
				onCapturingGroupEnter(cgNode) {
					const precedingQuantifier = findPrecedingQuantifier(cgNode);
					const firstAlternative = cgNode.alternatives[0];
					if (precedingQuantifier && firstAlternative) {
						const startQuantifier = getStartQuantifier(firstAlternative, "ltr");
						if (startQuantifier) {
							const precedingTypes = getMatchableCharacterTypes(
								precedingQuantifier.element,
							);
							const captureTypes = getMatchableCharacterTypes(
								startQuantifier.element,
							);

							if (hasOverlap(precedingTypes, captureTypes)) {
								const behavior =
									startQuantifier.min === 0
										? "the empty string"
										: `only ${startQuantifier.min} character${startQuantifier.min > 1 ? "s" : ""}`;

								context.report({
									data: {
										behavior,
										captureRaw: startQuantifier.raw,
										precedingRaw: precedingQuantifier.raw,
									},
									message: "misleadingStart",
									range: {
										begin: patternStart + startQuantifier.start,
										end: patternStart + startQuantifier.end,
									},
								});
							}
						}
					}

					const endQuantifier = getEndQuantifier(cgNode);
					const followingElement = findFollowingElement(cgNode);
					if (endQuantifier && followingElement) {
						const endTypes = getMatchableCharacterTypes(endQuantifier.element);
						const followingTypes = getMatchableCharacterTypes(followingElement);

						if (hasOverlap(endTypes, followingTypes)) {
							context.report({
								data: {
									quantifierRaw: endQuantifier.raw,
								},
								message: "misleadingEnd",
								range: {
									begin: patternStart + endQuantifier.start,
									end: patternStart + endQuantifier.end,
								},
							});
						}
					}
				},
			});
		}

		function checkRegexLiteral(
			node: AST.RegularExpressionLiteral,
			{ sourceFile }: { sourceFile: ts.SourceFile },
		) {
			const text = node.getText(sourceFile);
			const match = /^\/(.*)\/([dgimsuyv]*)$/.exec(text);

			if (!match) {
				return;
			}

			const [, pattern, flags] = match;

			if (!pattern) {
				return;
			}

			const nodeStart = node.getStart(sourceFile);
			checkPattern(pattern, nodeStart + 1, flags ?? "");
		}

		function checkRegExpConstructor(
			node: AST.CallExpression | AST.NewExpression,
			{ sourceFile }: { sourceFile: ts.SourceFile },
		) {
			if (
				node.expression.kind !== ts.SyntaxKind.Identifier ||
				node.expression.text !== "RegExp"
			) {
				return;
			}

			const args = node.arguments;
			if (!args?.length) {
				return;
			}

			const firstArgument = args[0];

			if (
				!firstArgument ||
				firstArgument.kind !== ts.SyntaxKind.StringLiteral
			) {
				return;
			}

			const patternStart = firstArgument.getStart(sourceFile) + 1;

			let flags = "";
			const secondArgument = args[1];
			if (secondArgument?.kind === ts.SyntaxKind.StringLiteral) {
				flags = secondArgument.text;
			}

			checkPattern(firstArgument.text, patternStart, flags);
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
