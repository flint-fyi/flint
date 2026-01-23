import {
	parseRegExpLiteral,
	type AST as RegExpAST,
	visitRegExpAST,
} from "@eslint-community/regexpp";
import {
	type AST,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

interface Issue {
	duplicate: RegExpAST.Character | RegExpAST.CharacterClassRange;
	end: number;
	original: RegExpAST.Character | RegExpAST.CharacterClassRange;
	start: number;
}

function adjustPositionForEscapes(escaped: string, unescapedPos: number) {
	let escapedIndex = 0;
	let unescapedIndex = 0;

	while (unescapedIndex < unescapedPos && escapedIndex < escaped.length) {
		if (escaped[escapedIndex] === "\\" && escaped[escapedIndex + 1] === "\\") {
			escapedIndex += 2;
		} else {
			escapedIndex += 1;
		}
		unescapedIndex += 1;
	}

	return escapedIndex;
}

function findDuplicatesInCharacterClass(
	characterClass: RegExpAST.CharacterClass,
): Issue[] {
	const issues: Issue[] = [];
	const seenCharacters = new Map<number, RegExpAST.Character>();
	const seenRanges: RegExpAST.CharacterClassRange[] = [];

	for (const element of characterClass.elements) {
		if (element.type === "Character") {
			const existing = seenCharacters.get(element.value);
			if (existing) {
				issues.push({
					duplicate: element,
					end: element.end,
					original: existing,
					start: element.start,
				});
			} else {
				seenCharacters.set(element.value, element);
			}
		} else if (element.type === "CharacterClassRange") {
			const duplicateRange = seenRanges.find(
				(range) =>
					range.min.value === element.min.value &&
					range.max.value === element.max.value,
			);
			if (duplicateRange) {
				issues.push({
					duplicate: element,
					end: element.end,
					original: duplicateRange,
					start: element.start,
				});
			} else {
				seenRanges.push(element);
			}
		}
	}

	for (const [charValue, charElement] of seenCharacters) {
		for (const range of seenRanges) {
			if (charValue >= range.min.value && charValue <= range.max.value) {
				const alreadyReported = issues.some(
					(issue) => issue.duplicate === charElement,
				);
				if (!alreadyReported) {
					issues.push({
						duplicate: charElement,
						end: charElement.end,
						original: range,
						start: charElement.start,
					});
				}
			}
		}
	}

	return issues;
}

function findIssues(pattern: string, flags: string): Issue[] {
	const issues: Issue[] = [];

	let ast: RegExpAST.RegExpLiteral;
	try {
		ast = parseRegExpLiteral(new RegExp(pattern, flags));
	} catch {
		return issues;
	}

	visitRegExpAST(ast, {
		onCharacterClassEnter(ccNode: RegExpAST.CharacterClass) {
			const duplicates = findDuplicatesInCharacterClass(ccNode);
			issues.push(...duplicates);
		},
	});

	return issues;
}

function formatElement(
	element: RegExpAST.Character | RegExpAST.CharacterClassRange,
): string {
	return element.raw;
}

function getRegexPattern(node: AST.RegularExpressionLiteral): {
	flags: string;
	pattern: string;
} {
	const text = node.text;
	const lastSlash = text.lastIndexOf("/");
	return {
		flags: text.slice(lastSlash + 1),
		pattern: text.slice(1, lastSlash),
	};
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports duplicate characters in regular expression character classes.",
		id: "regexDuplicateCharacterClassCharacters",
		presets: ["logical"],
	},
	messages: {
		duplicate: {
			primary: "Duplicate character '{{ character }}' in character class.",
			secondary: [
				"This character appears multiple times in the character class and only one occurrence is needed.",
			],
			suggestions: ["Remove the duplicate character."],
		},
		includedInRange: {
			primary:
				"Character '{{ character }}' is already included in range '{{ range }}'.",
			secondary: [
				"This character is redundant because it falls within the specified range.",
			],
			suggestions: ["Remove the redundant character."],
		},
	},
	setup(context) {
		function checkRegexLiteral(
			node: AST.RegularExpressionLiteral,
			{ sourceFile }: TypeScriptFileServices,
		) {
			const { flags, pattern } = getRegexPattern(node);
			const issues = findIssues(pattern, flags);

			const nodeStart = node.getStart(sourceFile);

			for (const issue of issues) {
				const isCharacterInRange =
					issue.duplicate.type === "Character" &&
					issue.original.type === "CharacterClassRange";
				context.report({
					data: {
						character: formatElement(issue.duplicate),
						range: isCharacterInRange ? formatElement(issue.original) : "",
					},
					message: isCharacterInRange ? "includedInRange" : "duplicate",
					range: {
						begin: nodeStart + issue.start,
						end: nodeStart + issue.end,
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
			if (!args?.length) {
				return;
			}

			const firstArg = args[0];
			if (!firstArg || firstArg.kind !== ts.SyntaxKind.StringLiteral) {
				return;
			}

			const stringLiteral = firstArg;
			const rawText = stringLiteral.getText(services.sourceFile);
			const pattern = rawText.slice(1, -1);

			let flags = "";
			if (args.length >= 2) {
				const secondArg = args[1];
				if (secondArg?.kind === ts.SyntaxKind.StringLiteral) {
					const flagsText = secondArg.getText(services.sourceFile);
					flags = flagsText.slice(1, -1);
				}
			}

			const unescapedPattern = pattern.replace(/\\\\/g, "\\");
			const issues = findIssues(unescapedPattern, flags);

			const nodeStart = firstArg.getStart(services.sourceFile);

			for (const issue of issues) {
				const isCharacterInRange =
					issue.duplicate.type === "Character" &&
					issue.original.type === "CharacterClassRange";
				const adjustedStart = adjustPositionForEscapes(
					pattern,
					issue.start - 1,
				);
				const adjustedEnd = adjustPositionForEscapes(pattern, issue.end - 1);

				context.report({
					data: {
						character: formatElement(issue.duplicate),
						range: isCharacterInRange ? formatElement(issue.original) : "",
					},
					message: isCharacterInRange ? "includedInRange" : "duplicate",
					range: {
						begin: nodeStart + 1 + adjustedStart,
						end: nodeStart + 1 + adjustedEnd,
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
