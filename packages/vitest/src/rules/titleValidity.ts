import type ts from "typescript";
import { SyntaxKind, TypeFlags } from "typescript";
import { z } from "zod/v4";

import {
	getTSNodeRange,
	isStaticString,
	typescriptLanguage,
	type AST,
	type StaticString,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "../ruleCreator.ts";
import { parseVitestFunctionCall } from "../utils/parseVitestFunctionCall.ts";

const matcherSchema = z.union([
	z.string(),
	z.tuple([z.string()]),
	z.tuple([z.string(), z.string()]),
]);

const matchersSchema = z.union([
	matcherSchema,
	z.object({
		describe: matcherSchema.optional(),
		it: matcherSchema.optional(),
		test: matcherSchema.optional(),
	}),
]);

const options = {
	allowArguments: z
		.boolean()
		.default(false)
		.describe(
			"Whether to allow identifiers and other dynamic values as title.",
		),
	disallowedWords: z
		.array(z.string())
		.default([])
		.describe("Words that are not allowed to appear in title."),
	ignoreTypeOfDescribeName: z
		.boolean()
		.default(false)
		.describe("Whether to skip checking the type of `describe()` title."),
	mustMatch: matchersSchema
		.optional()
		.describe(
			"Regular expressions that title must match, optionally with a custom message.",
		),
	mustNotMatch: matchersSchema
		.optional()
		.describe(
			"Regular expressions that title must not match, optionally with a custom message.",
		),
};

type Matchers = z.infer<typeof matchersSchema>;
type Options = z.infer<z.ZodObject<typeof options>>;
type TitleGroup = "describe" | "it" | "test";

function containsStaticString(node: AST.BinaryExpression): boolean {
	if (isStaticString(node.right)) {
		return true;
	}

	if (node.left.kind === SyntaxKind.BinaryExpression) {
		return containsStaticString(node.left);
	}

	return isStaticString(node.left);
}

function findMatcher(matchers: Matchers | undefined, group: TitleGroup) {
	if (matchers === undefined) {
		return undefined;
	}

	const matcher =
		typeof matchers === "string" || Array.isArray(matchers)
			? matchers
			: matchers[group];
	if (matcher === undefined) {
		return undefined;
	}

	const [pattern, message] =
		typeof matcher === "string" ? ([matcher] as const) : matcher;

	return { message, pattern: new RegExp(pattern, "u") };
}

function getTitleGroup(name: string | undefined) {
	switch (name) {
		case "describe":
		case "xdescribe":
			return "describe";

		case "fit":
		case "it":
		case "xit":
			return "it";

		case "test":
		case "xtest":
			return "test";
	}
}

function isClassOrFunctionType(type: ts.Type) {
	return (
		!!type.getCallSignatures().length || !!type.getConstructSignatures().length
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports `describe()`, `it()`, and `test()` calls with invalid titles.",
		id: "titleValidity",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		accidentalSpace: {
			primary: "Should not have leading or trailing spaces",
			secondary: [
				"Vitest joins nested titles with spaces and matches `--testNamePattern` against the joined name.",
				"Whitespace at the edges of a title is invisible in reports but still changes what those patterns match.",
			],
			suggestions: [
				"Remove the whitespace at the start and end of this title.",
			],
		},
		disallowedWord: {
			primary: "`{{ word }}` is not allowed in test title.",
			secondary: [
				"This word is listed in the `disallowedWords` option for this rule.",
			],
			suggestions: ["Rewrite this title without the word `{{ word }}`."],
		},
		duplicatePrefix: {
			primary: "Should not have duplicate prefix",
			secondary: [
				"The `{{ functionName }}()` call already indicates what kind of block this is.",
				"Repeating it at the start of the title makes reported names longer without adding information.",
			],
			suggestions: ["Remove the `{{ functionName }}` prefix from this title."],
		},
		emptyTitle: {
			primary: "`{{ functionName }}` should not have an empty title.",
			secondary: [
				"Vitest identifies blocks by their titles in reports and in `--testNamePattern` matching.",
				"An empty title leaves this block identifiable only by its position in the file.",
			],
			suggestions: [
				"Add a title describing what this `{{ functionName }}()` covers.",
			],
		},
		mustMatch: {
			primary: "`{{ functionName }}` should match {{ pattern }}.",
			secondary: [
				"Titles for `{{ functionName }}` are required to match the `mustMatch` option for this rule.",
			],
			suggestions: ["Rewrite this title so it matches {{ pattern }}."],
		},
		mustMatchCustom: {
			primary: "`{{ functionName }}` should match {{ pattern }}. {{ message }}",
			secondary: [
				"Titles for `{{ functionName }}` are required to match the `mustMatch` option for this rule.",
			],
			suggestions: ["Rewrite this title so it matches {{ pattern }}."],
		},
		mustNotMatch: {
			primary: "`{{ functionName }}` should not match {{ pattern }}.",
			secondary: [
				"Titles for `{{ functionName }}` are required not to match the `mustNotMatch` option for this rule.",
			],
			suggestions: ["Rewrite this title so it does not match {{ pattern }}."],
		},
		mustNotMatchCustom: {
			primary:
				"`{{ functionName }}` should not match {{ pattern }}. {{ message }}",
			secondary: [
				"Titles for `{{ functionName }}` are required not to match the `mustNotMatch` option for this rule.",
			],
			suggestions: ["Rewrite this title so it does not match {{ pattern }}."],
		},
		titleMustBeString: {
			primary: "Test title must be a string, a function or class name.",
			secondary: [
				"Vitest converts other values to strings, turning objects into titles such as `[object Object]`.",
				"Titles that don't read as text make reports and `--testNamePattern` filters harder to use.",
			],
			suggestions: [
				"Change this title to a string.",
				"Pass a function or class whose name describes what's under test.",
			],
		},
	},
	options,
	setup(context) {
		function checkMatchers(
			options: Options,
			group: TitleGroup,
			title: string,
			range: ReturnType<typeof getTSNodeRange>,
		) {
			const mustNotMatch = findMatcher(options.mustNotMatch, group);
			if (mustNotMatch?.pattern.test(title)) {
				context.report({
					data: {
						functionName: group,
						message: mustNotMatch.message ?? "",
						pattern: String(mustNotMatch.pattern),
					},
					message: mustNotMatch.message ? "mustNotMatchCustom" : "mustNotMatch",
					range,
				});
				return;
			}

			const mustMatch = findMatcher(options.mustMatch, group);
			if (mustMatch && !mustMatch.pattern.test(title)) {
				context.report({
					data: {
						functionName: group,
						message: mustMatch.message ?? "",
						pattern: String(mustMatch.pattern),
					},
					message: mustMatch.message ? "mustMatchCustom" : "mustMatch",
					range,
				});
			}
		}

		function checkTitle(
			argument: StaticString,
			group: TitleGroup,
			options: Options,
			sourceFile: AST.SourceFile,
		) {
			const range = getTSNodeRange(argument, sourceFile);
			const title = argument.text;

			if (!title) {
				context.report({
					data: { functionName: group },
					message: "emptyTitle",
					range,
				});
				return;
			}

			if (options.disallowedWords.length) {
				const disallowedMatch = new RegExp(
					`\\b(${options.disallowedWords.join("|")})\\b`,
					"iu",
				).exec(title);

				if (disallowedMatch) {
					context.report({
						data: { word: disallowedMatch[0] },
						message: "disallowedWord",
						range,
					});
					return;
				}
			}

			const text = argument.getText(sourceFile);

			if (title.trim() !== title) {
				const trimmed = text
					.replace(/^(['"`])\s+/u, "$1")
					.replace(/\s+(['"`])$/u, "$1");

				context.report({
					fix: trimmed === text ? undefined : [{ range, text: trimmed }],
					message: "accidentalSpace",
					range,
				});
			}

			if (title.split(" ")[0]?.toLowerCase() === group) {
				context.report({
					data: { functionName: group },
					fix: [{ range, text: text.replace(/^(['"`]).+? /u, "$1") }],
					message: "duplicatePrefix",
					range,
				});
			}

			checkMatchers(options, group, title, range);
		}

		return {
			visitors: {
				CallExpression: (node, { options, sourceFile, typeChecker }) => {
					const group = getTitleGroup(parseVitestFunctionCall(node)?.name);
					if (!group) {
						return;
					}

					const [argument] = node.arguments;
					if (!argument) {
						return;
					}

					const type = typeChecker.getTypeAtLocation(argument);
					if (isClassOrFunctionType(type)) {
						return;
					}

					if (
						options.allowArguments &&
						argument.kind === SyntaxKind.Identifier
					) {
						return;
					}

					if (isStaticString(argument)) {
						checkTitle(argument, group, options, sourceFile);
						return;
					}

					if (
						(argument.kind === SyntaxKind.BinaryExpression &&
							containsStaticString(argument)) ||
						(type.flags & TypeFlags.StringLike) !== 0
					) {
						return;
					}

					if (!(options.ignoreTypeOfDescribeName && group === "describe")) {
						context.report({
							message: "titleMustBeString",
							range: getTSNodeRange(argument, sourceFile),
						});
					}
				},
			},
		};
	},
});
