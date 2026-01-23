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
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

interface EmptyCapturingGroup {
	end: number;
	start: number;
}

function elementIsZeroLength(element: Element): boolean {
	switch (element.type) {
		case "Assertion":
			return true;

		case "Backreference":
			return false;

		case "CapturingGroup":
		case "Group":
			return element.alternatives.every((alt) =>
				alt.elements.every(elementIsZeroLength),
			);

		case "Character":
		case "CharacterClass":
		case "CharacterSet":
		case "ExpressionCharacterClass":
			return false;

		case "Quantifier":
			return element.min === 0 || elementIsZeroLength(element.element);

		default:
			return false;
	}
}

function findEmptyCapturingGroups(
	pattern: string,
	flags: string,
): EmptyCapturingGroup[] {
	const results: EmptyCapturingGroup[] = [];

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
				results.push({
					end: node.end,
					start: node.start,
				});
			}
		},
	});

	return results;
}

function getRegexInfo(node: AST.RegularExpressionLiteral) {
	const text = node.text;
	const lastSlash = text.lastIndexOf("/");
	return {
		flags: text.slice(lastSlash + 1),
		pattern: text.slice(1, lastSlash),
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
			primary: "Capturing group captures only empty strings.",
			secondary: [
				"This capturing group will only ever match zero-length text.",
				"It may indicate a mistake in the pattern.",
			],
			suggestions: [
				"Add content to the capturing group or convert it to a non-capturing group.",
			],
		},
	},
	setup(context) {
		function checkRegexLiteral(
			node: AST.RegularExpressionLiteral,
			services: TypeScriptFileServices,
		) {
			const { flags, pattern } = getRegexInfo(node);
			const emptyGroups = findEmptyCapturingGroups(pattern, flags);
			const nodeStart = node.getStart(services.sourceFile);

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
			if (
				node.expression.kind !== ts.SyntaxKind.Identifier ||
				node.expression.text !== "RegExp"
			) {
				return;
			}

			const args = node.arguments;
			if (!args || args.length === 0) {
				return;
			}

			const patternArg = args[0];
			if (!patternArg || patternArg.kind !== ts.SyntaxKind.StringLiteral) {
				return;
			}

			const rawText = patternArg.getText(services.sourceFile);
			const pattern = rawText.slice(1, -1).replace(/\\\\/g, "\\");

			let flags = "";
			if (args.length >= 2) {
				const flagsArg = args[1];
				if (flagsArg?.kind === ts.SyntaxKind.StringLiteral) {
					const flagsText = flagsArg.getText(services.sourceFile);
					flags = flagsText.slice(1, -1);
				}
			}

			const emptyGroups = findEmptyCapturingGroups(pattern, flags);
			const patternNodeStart = patternArg.getStart(services.sourceFile);

			for (const group of emptyGroups) {
				context.report({
					message: "emptyCapture",
					range: {
						begin: patternNodeStart + group.start,
						end: patternNodeStart + group.end,
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
