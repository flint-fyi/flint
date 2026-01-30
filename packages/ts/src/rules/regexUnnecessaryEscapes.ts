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

import { ruleCreator } from "./ruleCreator.ts";
import { getRegExpConstruction } from "./utils/getRegExpConstruction.ts";
import { getRegExpLiteralDetails } from "./utils/getRegExpLiteralDetails.ts";

const allowedRoots = new Set([
	"$",
	"(",
	")",
	"*",
	"+",
	".",
	"/",
	"?",
	"[",
	"\\",
	"]",
	"^",
	"{",
	"|",
	"}",
]);

const allowedClasses = new Set(["\\", "]"]);

interface Finding {
	character: string;
	end: number;
	start: number;
}

function adjustPositionForEscapes(escaped: string, unescapedPosition: number) {
	let escapedIndex = 0;
	let unescapedIndex = 0;

	while (unescapedIndex < unescapedPosition && escapedIndex < escaped.length) {
		if (escaped[escapedIndex] === "\\" && escaped[escapedIndex + 1] === "\\") {
			escapedIndex += 2;
		} else {
			escapedIndex += 1;
		}
		unescapedIndex += 1;
	}

	return escapedIndex;
}

function findUnnecessaryEscapes(pattern: string, flags: string) {
	const findings: Finding[] = [];

	let ast: RegExpAST.RegExpLiteral;
	try {
		ast = parseRegExpLiteral(new RegExp(pattern, flags));
	} catch {
		return findings;
	}

	let currentClass: RegExpAST.CharacterClass | undefined;

	visitRegExpAST(ast, {
		onCharacterClassEnter(classNode) {
			currentClass = classNode;
		},
		onCharacterClassLeave() {
			currentClass = undefined;
		},
		onCharacterEnter(charNode: RegExpAST.Character) {
			if (!charNode.raw.startsWith("\\")) {
				return;
			}

			const literal = String.fromCodePoint(charNode.value);
			if (charNode.raw.slice(1) !== literal) {
				return;
			}

			if (!currentClass) {
				if (!allowedRoots.has(literal)) {
					findings.push({
						character: literal,
						end: charNode.end,
						start: charNode.start,
					});
				}
				return;
			}

			if (allowedClasses.has(literal)) {
				return;
			}

			if (literal === "^") {
				if (currentClass.negate || charNode.start !== currentClass.start + 1) {
					findings.push({
						character: literal,
						end: charNode.end,
						start: charNode.start,
					});
				}
				return;
			}

			if (literal === "-") {
				if (
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					charNode.start === currentClass.elements[0]!.start ||
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					charNode.start === currentClass.elements.at(-1)!.start
				) {
					findings.push({
						character: literal,
						end: charNode.end,
						start: charNode.start,
					});
				}
				return;
			}

			findings.push({
				character: literal,
				end: charNode.end,
				start: charNode.start,
			});
		},
	});

	return findings;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports unnecessary escape sequences in regular expressions.",
		id: "regexUnnecessaryEscapes",
		presets: ["stylistic"],
	},
	messages: {
		unnecessary: {
			primary: "This escape sequence `\\{{ character }}` is unnecessary.",
			secondary: [
				"The character `{{ character }}` does not require escaping in this context.",
				"Removing the escaping backslash will not change the regular expression.",
			],
			suggestions: ["Remove the backslash to simplify the pattern."],
		},
	},
	setup(context) {
		function checkPattern(flags: string, pattern: string, start: number) {
			const findings = findUnnecessaryEscapes(pattern, flags);

			for (const finding of findings) {
				const adjustedStart = adjustPositionForEscapes(
					pattern,
					finding.start - 1,
				);
				const adjustedEnd = adjustPositionForEscapes(pattern, finding.end - 1);

				context.report({
					data: {
						character: finding.character,
					},
					message: "unnecessary",
					range: {
						begin: start + 1 + adjustedStart,
						end: start + 1 + adjustedEnd,
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

			const patternUnescaped = construction.pattern.replace(/\\\\/g, "\\");
			checkPattern(construction.flags, patternUnescaped, construction.start);
		}

		function checkRegexLiteral(
			node: AST.RegularExpressionLiteral,
			services: TypeScriptFileServices,
		) {
			const details = getRegExpLiteralDetails(node, services);
			checkPattern(details.flags, details.pattern, details.start - 1);
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
