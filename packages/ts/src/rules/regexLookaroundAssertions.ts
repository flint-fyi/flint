import { visitRegExpAST } from "@eslint-community/regexpp";
import type { AST as RegExpAST } from "@eslint-community/regexpp";
import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";
import { getConstrainedTypeAtLocation } from "./utils/getConstrainedType.ts";
import { parseRegexpAst } from "./utils/parseRegexpAst.ts";

interface BoundaryGroup {
	group: RegExpAST.CapturingGroup;
	position: "end" | "start";
}

function buildFixedPattern(
	originalPattern: string,
	boundaryGroups: BoundaryGroup[],
) {
	let result = originalPattern;

	for (const { group, position } of [...boundaryGroups].reverse()) {
		const assertion = position === "start" ? "(?<=" : "(?=";
		const groupContent = groupToRaw(group);
		const replacement = `${assertion}${groupContent})`;
		result =
			result.slice(0, group.start) + replacement + result.slice(group.end);
	}

	return result;
}

function buildFixedReplacement(
	originalText: string,
	boundaryGroups: BoundaryGroup[],
) {
	let result = originalText;

	for (let i = boundaryGroups.length; i >= 1; i--) {
		result = result.replaceAll(`$${i}`, "");
	}

	return result;
}

function getBoundaryGroups(
	pattern: RegExpAST.Pattern,
	groups: RegExpAST.CapturingGroup[],
) {
	if (
		groups.length === 0 ||
		groups.length > 2 ||
		groups.some((group) => group.name != null)
	) {
		return undefined;
	}

	const alternatives = pattern.alternatives;
	if (alternatives.length !== 1) {
		return undefined;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const elements = alternatives[0]!.elements;
	if (elements.length < 2) {
		return undefined;
	}

	const result: BoundaryGroup[] = [];

	const firstElement = elements[0];
	const lastElement = elements.at(-1);

	if (groups.length === 1) {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const group = groups[0]!;
		if (firstElement === group) {
			result.push({ group, position: "start" });
		} else if (lastElement === group) {
			result.push({ group, position: "end" });
		} else {
			return undefined;
		}
	} else {
		const [first, second] = groups;
		if (firstElement === first && lastElement === second) {
			result.push(
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				{ group: first!, position: "start" },
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				{ group: second!, position: "end" },
			);
		} else {
			return undefined;
		}
	}

	return result;
}

function getCapturingGroups(pattern: RegExpAST.Pattern) {
	const groups: RegExpAST.CapturingGroup[] = [];

	visitRegExpAST(pattern, {
		onCapturingGroupEnter(groupNode) {
			groups.push(groupNode);
		},
	});

	return groups;
}

function getRegexPatternAndFlags(node: AST.Expression) {
	if (node.kind !== ts.SyntaxKind.RegularExpressionLiteral) {
		return undefined;
	}

	const match = /^\/(.+)\/([dgimsuyv]*)$/.exec(node.text);
	if (!match) {
		return undefined;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	return { flags: match[2]!, pattern: match[1]! };
}

function groupToRaw(group: RegExpAST.CapturingGroup) {
	return group.alternatives
		.flatMap((alternative) =>
			alternative.elements.flatMap((element) => element.raw),
		)
		.join("");
}

function hasBackreferences(pattern: RegExpAST.Pattern) {
	let found = false;

	visitRegExpAST(pattern, {
		onBackreferenceEnter() {
			found = true;
		},
	});

	return found;
}

function hasSpecialDollarSyntax(text: string) {
	return /\$[$&'`]|\$<[^>]+>/.test(text);
}

function hasVariableLengthContent(node: RegExpAST.Node): boolean {
	let found = false;

	visitRegExpAST(node, {
		onQuantifierEnter(quantifier) {
			if (quantifier.min !== quantifier.max) {
				found = true;
			}
		},
	});

	return found;
}

function parseReplacementReferences(text: string) {
	const references = new Map<number, number>();
	const pattern = /\$(\d+)/g;
	let match: null | RegExpExecArray;

	while ((match = pattern.exec(text))) {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const index = parseInt(match[1]!, 10);
		if (index > 0) {
			references.set(index, (references.get(index) ?? 0) + 1);
		}
	}

	return references;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports capturing groups at pattern boundaries that can be replaced with lookaround assertions.",
		id: "regexLookaroundAssertions",
		presets: ["stylisticStrict"],
	},
	messages: {
		preferLookaround: {
			primary:
				"This capturing group can be optimized by switching to a lookaround assertion.",
			secondary: [
				"Lookaround assertions avoid re-inserting captured content in the replacement string.",
				"Using them allows engines to more easily optimize regular expressions.",
			],
			suggestions: ["Convert to a lookahead or lookbehind assertion."],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression: (node, { sourceFile, typeChecker }) => {
					if (
						!ts.isPropertyAccessExpression(node.expression) ||
						(node.expression.name.text !== "replace" &&
							node.expression.name.text !== "replaceAll") ||
						node.arguments.length < 2
					) {
						return;
					}

					const objectType = getConstrainedTypeAtLocation(
						node.expression.expression,
						typeChecker,
					);
					if (!(objectType.flags & ts.TypeFlags.StringLike)) {
						return;
					}

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const regexArgument = node.arguments[0]!;
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const replacementArgument = node.arguments[1]!;

					if (
						!ts.isStringLiteral(replacementArgument) ||
						hasSpecialDollarSyntax(replacementArgument.text)
					) {
						return;
					}

					const regexInfo = getRegexPatternAndFlags(regexArgument);
					if (!regexInfo) {
						return;
					}

					const regexpAst = parseRegexpAst(regexInfo.pattern, regexInfo.flags);
					if (!regexpAst || hasBackreferences(regexpAst)) {
						return;
					}

					const capturingGroups = getCapturingGroups(regexpAst);
					if (capturingGroups.length === 0 || capturingGroups.length > 2) {
						return;
					}

					const boundaryGroups = getBoundaryGroups(regexpAst, capturingGroups);
					if (!boundaryGroups) {
						return;
					}

					const references = parseReplacementReferences(
						replacementArgument.text,
					);

					for (let i = 0; i < boundaryGroups.length; i++) {
						if (references.get(i + 1) !== 1) {
							return;
						}
					}

					for (const { group, position } of boundaryGroups) {
						if (position === "start" && hasVariableLengthContent(group)) {
							return;
						}
					}

					const regexRange = getTSNodeRange(regexArgument, sourceFile);
					const replacementRange = getTSNodeRange(
						replacementArgument,
						sourceFile,
					);

					const fixedPattern = buildFixedPattern(
						regexInfo.pattern,
						boundaryGroups,
					);
					const fixedReplacement = buildFixedReplacement(
						replacementArgument.text,
						boundaryGroups,
					);

					const fix = [
						{
							range: {
								begin: regexRange.begin + 1,
								end: regexRange.end - 1 - regexInfo.flags.length,
							},
							text: fixedPattern,
						},
						{
							range: {
								begin: replacementRange.begin + 1,
								end: replacementRange.end - 1,
							},
							text: fixedReplacement,
						},
					];

					for (const { group } of boundaryGroups) {
						const groupRange = {
							begin: regexRange.begin + 1 + group.start,
							end: regexRange.begin + 1 + group.end,
						};

						context.report({
							fix,
							message: "preferLookaround",
							range: groupRange,
						});
					}
				},
			},
		};
	},
});
