import { parseRegExpLiteral, visitRegExpAST } from "@eslint-community/regexpp";
import type {
	CapturingGroup,
	Element,
	RegExpLiteral,
} from "@eslint-community/regexpp/ast";
import {
	type AST,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { getRegExpConstruction } from "./utils/getRegExpConstruction.ts";
import { getRegExpLiteralDetails } from "./utils/getRegExpLiteralDetails.ts";

// Allowed flags set
const allowedFlags = new Set([
	0x64, // d
	0x67, // g
	0x69, // i
	0x6d, // m
	0x73, // s
	0x75, // u
	0x76, // v
	0x79, // y
]);

function elementIsZeroLength(element: Element): boolean {
	switch (element.type) {
		case "Assertion":
			return true;

		case "CapturingGroup":
		case "Group":
			return element.alternatives.every((alt) =>
				alt.elements.every(elementIsZeroLength),
			);

		case "Quantifier":
			return element.min === 0 || elementIsZeroLength(element.element);

		default:
			return false;
	}
}

function findEmptyCapturingGroups(pattern: string, flags: string) {
	const results: CapturingGroup[] = [];

	let ast: RegExpLiteral;
	try {
		ast = parseRegExpLiteral(new RegExp(pattern, flags));
	} catch {
		return results;
	}

	visitRegExpAST(ast, {
		onCapturingGroupEnter(node: CapturingGroup) {
			// Skip named capturing groups; optional content is often intentional.
			if (node.name) {
				return;
			}
			const onlyEmpty = node.alternatives.every((alternate) =>
				alternate.elements.every(elementIsZeroLength),
			);

			// Exception: groups like ([\s\S]*?) used to match any text are not considered empty-only
			const hasAnyCharQuantifier = node.alternatives.some((alternate) => {
				if (alternate.elements.length !== 1) {
					return false;
				}
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const element = alternate.elements[0]!;
				if (
					element.type !== "Quantifier" ||
					element.element.type !== "CharacterClass"
				) {
					return false;
				}

				let hasSpace = false;
				let hasNonSpace = false;

				for (const child of element.element.elements) {
					if (child.type !== "CharacterSet" || child.kind !== "space") {
						continue;
					}

					if (child.negate) {
						hasNonSpace = true;
					} else {
						hasSpace = true;
					}

					if (hasSpace && hasNonSpace) {
						return true;
					}
				}

				return false;
			});

			// Exception for flag-capturing groups like ([dgimsuyv]*)
			const isFlagGroup = node.alternatives.some((alternate) => {
				if (alternate.elements.length !== 1) {
					return false;
				}

				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const element = alternate.elements[0]!;
				if (
					element.type !== "Quantifier" ||
					element.element.type !== "CharacterClass"
				) {
					return false;
				}

				for (const child of element.element.elements) {
					if (child.type !== "Character" || !allowedFlags.has(child.value)) {
						return false;
					}
				}

				return true;
			});

			if (onlyEmpty && !hasAnyCharQuantifier && !isFlagGroup) {
				results.push(node);
			}
		},
	});

	return results;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports capturing groups that only capture empty strings.",
		id: "regexEmptyCapturingGroups",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		emptyCapture: {
			primary: "This capturing group captures only empty strings.",
			secondary: [
				"This capturing group will only ever match zero-length text.",
				"It may indicate a mistake in the pattern.",
			],
			suggestions: [
				"Add content to the capturing group.",
				"Convert the capturing group to a non-capturing group.",
			],
		},
	},
	setup(context) {
		function checkRegexLiteral(
			node: AST.RegularExpressionLiteral,
			services: TypeScriptFileServices,
		) {
			const { flags, pattern, start } = getRegExpLiteralDetails(node, services);
			const emptyGroups = findEmptyCapturingGroups(pattern, flags);

			for (const group of emptyGroups) {
				context.report({
					message: "emptyCapture",
					range: {
						begin: start + group.start - 1,
						end: start + group.end - 1,
					},
				});
			}
		}

		function checkRegExpConstructor(
			node: AST.CallExpression | AST.NewExpression,
			services: TypeScriptFileServices,
		) {
			const construction = getRegExpConstruction(node, services);
			if (!construction) {
				return;
			}

			const patternEscaped = construction.pattern.replace(/\\\\/g, "\\");
			const emptyGroups = findEmptyCapturingGroups(
				patternEscaped,
				construction.flags,
			);

			for (const group of emptyGroups) {
				context.report({
					message: "emptyCapture",
					range: {
						begin: construction.start + group.start,
						end: construction.start + group.end,
					},
				});
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
