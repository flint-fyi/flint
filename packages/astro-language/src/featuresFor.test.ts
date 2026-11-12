import { describe, expect, it } from "vitest";

import { SpanMappingFeature } from "@flint.fyi/content-mapper";

import { featuresFor } from "./featuresFor.ts";

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
