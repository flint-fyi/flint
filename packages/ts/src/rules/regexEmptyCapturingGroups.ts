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
			const allAlternativesEmpty = node.alternatives.every((alt) =>
				alt.elements.every(elementIsZeroLength),
			);

			if (allAlternativesEmpty) {
				results.push(node);
			}
		},
	});

	return results;
}

function getRegexInfo(node: AST.RegularExpressionLiteral) {
	const lastSlash = node.text.lastIndexOf("/");
	return {
		flags: node.text.slice(lastSlash + 1),
		pattern: node.text.slice(1, lastSlash),
	};
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports capturing groups that only capture empty strings.",
		id: "regexEmptyCapturingGroups",
		presets: ["logical"],
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
			{ sourceFile }: TypeScriptFileServices,
		) {
			const { flags, pattern } = getRegexInfo(node);
			const emptyGroups = findEmptyCapturingGroups(pattern, flags);
			const nodeStart = node.getStart(sourceFile);

			for (const group of emptyGroups) {
				context.report({
					message: "emptyCapture",
					range: {
						begin: nodeStart + group.start,
						end: nodeStart + group.end,
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
