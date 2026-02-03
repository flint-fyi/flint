import { parseRegExpLiteral, visitRegExpAST } from "@eslint-community/regexpp";
import type {
	Alternative,
	CapturingGroup,
	Element,
	Quantifier,
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
			if (node.name) {
				return;
			}

			const onlyEmpty = node.alternatives.every((alternate) =>
				alternate.elements.every(elementIsZeroLength),
			);

			if (onlyEmpty && !isAllowedException(node)) {
				results.push(node);
			}
		},
	});

	return results;
}

function getSingleQuantifier(alternate: Alternative): Quantifier | undefined {
	if (alternate.elements.length !== 1) {
		return undefined;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const element = alternate.elements[0]!;

	return element.type === "Quantifier" ? element : undefined;
}

function isAllowedException(node: CapturingGroup): boolean {
	return node.alternatives.some((alternate) => {
		// ([\d_]*) - optional character class that can be followed by required content
		// (\.[\d_]*) - required character followed by optional quantifier
		if (alternate.elements.length) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			if (isCharacterClassWithZeroMinimum(alternate.elements[0]!)) {
				return true;
			}
			if (
				alternate.elements.length === 2 &&
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				isCharacterClassWithZeroMinimum(alternate.elements[1]!)
			) {
				return true;
			}
		}

		const quantifier = getSingleQuantifier(alternate);
		if (!quantifier) {
			return false;
		}

		// (.*) or (.+) - any char quantifier
		if (
			quantifier.element.type === "CharacterSet" &&
			quantifier.element.kind === "any"
		) {
			return true;
		}

		// ([+-]?) or (\}?) - optional single char/class
		if (quantifier.max === 1) {
			if (
				quantifier.element.type === "CharacterClass" &&
				!!quantifier.element.elements.length
			) {
				return true;
			}
			if (
				quantifier.element.type === "Character" &&
				quantifier.element.raw.startsWith("\\")
			) {
				return true;
			}
		}

		if (quantifier.element.type !== "CharacterClass") {
			return false;
		}

		// ([\s\S]*?) - space + non-space for matching any text
		let hasSpace = false;
		let hasNonSpace = false;
		for (const child of quantifier.element.elements) {
			if (child.type === "CharacterSet" && child.kind === "space") {
				if (child.negate) {
					hasNonSpace = true;
				} else {
					hasSpace = true;
				}
			}

			if (hasSpace && hasNonSpace) {
				return true;
			}
		}

		// ([dgimsuyv]*) - flag characters only
		if (
			quantifier.element.elements.length &&
			quantifier.element.elements.every(
				(child) => child.type === "Character" && allowedFlags.has(child.value),
			)
		) {
			return true;
		}

		return false;
	});
}

function isCharacterClassWithZeroMinimum(element: Element) {
	return (
		element.type === "Quantifier" &&
		element.min === 0 &&
		element.element.type === "CharacterClass"
	);
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
