import { describe, expect, it } from "vitest";

import { SpanMappingFeature } from "@flint.fyi/content-mapper";

import {
	featuresFor,
	normalizeAstroMappings,
} from "./normalizeAstroMappings.ts";

const NAVIGATION_FEATURES =
	SpanMappingFeature.Definition |
	SpanMappingFeature.TypeDefinition |
	SpanMappingFeature.Implementation |
	SpanMappingFeature.References |
	SpanMappingFeature.DocumentHighlights |
	SpanMappingFeature.Rename |
	SpanMappingFeature.CallHierarchy |
	SpanMappingFeature.CodeActions;

const SEMANTIC_FEATURES =
	SpanMappingFeature.Hover |
	SpanMappingFeature.InlayHints |
	SpanMappingFeature.SemanticTokens |
	SpanMappingFeature.CodeLens;

describe(normalizeAstroMappings, () => {
	it("marks identical text verbatim and differing text atom", () => {
		expect(
			normalizeAstroMappings(
				[
					{
						data: { verification: true },
						generatedLengths: [1, 2],
						generatedOffsets: [0, 1],
						lengths: [1, 1],
						sourceOffsets: [0, 1],
					},
				],
				"abc",
				"ax",
			),
		).toEqual([
			[0, 1, 0, 1, 0, SpanMappingFeature.CodeActions],
			[1, 2, 1, 1, 1, SpanMappingFeature.CodeActions],
		]);
	});

	it("drops mappings that partially overlap an exact or longer original range", () => {
		expect(
			normalizeAstroMappings(
				[
					{
						data: {},
						generatedLengths: [1, 4, 4, 2, 0, 0],
						generatedOffsets: [9, 0, 5, 10, 12, 12],
						lengths: [2, 4, 4, 2, 0, 0],
						sourceOffsets: [1, 0, 0, 4, 2, 4],
					},
				],
				"abcdXabcdYefZ",
				"abcdef",
			),
		).toEqual([
			[0, 4, 0, 4, 0, 0],
			[5, 4, 0, 4, 0, 0],
			[10, 2, 4, 2, 0, 0],
			[12, 0, 4, 0, 0, 0],
		]);
	});

	it("drops a mapping that extends an exact mapping's virtual range over scaffolding", () => {
		const originalText = "---\nconst a = 1;\n---\n<p>{a}</p>\n";
		const generatedText =
			"/* prefix */\nconst a = 1;\n\n;{};<Fragment><p>{a}</p>\n";
		const frontmatter = originalText.indexOf("\nconst");
		const template = originalText.indexOf("<p>");

		expect(
			normalizeAstroMappings(
				[
					{
						data: { navigation: true, verification: true },
						generatedOffsets: [12, 41],
						lengths: [14, 11],
						sourceOffsets: [frontmatter, template],
					},
					{
						data: { navigation: true, verification: true },
						generatedLengths: [22],
						generatedOffsets: [12],
						lengths: [14],
						sourceOffsets: [frontmatter],
					},
				],
				generatedText,
				originalText,
			),
		).toEqual([
			[12, 14, frontmatter, 14, 0, NAVIGATION_FEATURES],
			[41, 11, template, 11, 0, NAVIGATION_FEATURES],
		]);
	});

	it("throws when mapping arrays have different lengths", () => {
		expect(() =>
			normalizeAstroMappings(
				[
					{
						data: {},
						generatedOffsets: [0, 1],
						lengths: [1],
						sourceOffsets: [0, 1],
					},
				],
				"ab",
				"ab",
			),
		).toThrow(/equal lengths/);
	});
});

describe(featuresFor, () => {
	it("enables every feature when every capability is enabled", () => {
		expect(
			featuresFor({
				completion: true,
				format: true,
				navigation: true,
				semantic: true,
				structure: true,
				verification: true,
			}),
		).toBe((SpanMappingFeature.CodeLens << 1) - 1);
	});

	it.each([
		[
			"semantic highlight false",
			{ semantic: { shouldHighlight: (): boolean => false } },
			SEMANTIC_FEATURES & ~SpanMappingFeature.SemanticTokens,
		],
		[
			"semantic highlight true",
			{ semantic: { shouldHighlight: (): boolean => true } },
			SEMANTIC_FEATURES,
		],
		[
			"navigation highlight false",
			{ navigation: { shouldHighlight: (): boolean => false } },
			NAVIGATION_FEATURES & ~SpanMappingFeature.DocumentHighlights,
		],
		[
			"navigation highlight true",
			{ navigation: { shouldHighlight: (): boolean => true } },
			NAVIGATION_FEATURES,
		],
		[
			"navigation rename false",
			{ navigation: { shouldRename: (): boolean => false } },
			NAVIGATION_FEATURES & ~SpanMappingFeature.Rename,
		],
		[
			"navigation rename true",
			{ navigation: { shouldRename: (): boolean => true } },
			NAVIGATION_FEATURES,
		],
	] as const)("preserves %s callback semantics", (_name, data, expected) => {
		expect(featuresFor(data)).toBe(expected);
	});
});
