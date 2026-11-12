import { describe, expect, test } from "vitest";

import { createMappedOutput } from "./createMappedOutput.ts";
import {
	SPAN_MAPPING_FEATURE_ALL,
	SpanMappingFeature,
	type MappedOutput,
	type SpanMapping,
} from "./protocol.ts";

function mapped(
	mappings: SpanMapping[],
	text = "abcdef",
	content = "abcdef",
): () => MappedOutput {
	return () =>
		createMappedOutput({ content, extension: ".ts", mappings, text });
}

describe(createMappedOutput, () => {
	test("sorts mappings by virtual offset and excludes scaffolding", () => {
		const text = "éfoo baz(); BAR";

		expect(
			createMappedOutput({
				content: "éfoo BAR",
				extension: ".ts",
				mappings: [
					[12, 3, 5, 3, 0],
					[0, 4, 0, 4, 0],
					[5, 3, 4, 0, 1],
				],
				text,
			}),
		).toEqual({
			extension: ".ts",
			mappings: [
				[0, 4, 0, 4, 0],
				[5, 3, 4, 0, 1],
				[12, 3, 5, 3, 0],
			],
			text,
		});
	});

	test("omits only the full feature mask and preserves zero and subsets", () => {
		expect(
			mapped(
				[
					[0, 1, 0, 1, 0, SPAN_MAPPING_FEATURE_ALL],
					[1, 1, 1, 1, 0, 0],
					[2, 1, 2, 1, 0, SpanMappingFeature.Hover],
				],
				"abc",
				"abc",
			)().mappings,
		).toEqual([
			[0, 1, 0, 1, 0],
			[1, 1, 1, 1, 0, 0],
			[2, 1, 2, 1, 0, SpanMappingFeature.Hover],
		]);
	});

	test("accepts exact duplicate original ranges at disjoint virtual ranges", () => {
		expect(
			mapped([
				[0, 2, 0, 2, 0],
				[3, 2, 0, 2, 1],
			]),
		).not.toThrow();
	});

	test.each([
		[
			"partial",
			[
				[0, 3, 0, 3, 1],
				[3, 3, 1, 3, 1],
			],
		],
		[
			"contained",
			[
				[0, 2, 0, 4, 1],
				[3, 2, 1, 2, 1],
			],
		],
	] satisfies [string, SpanMapping[]][])(
		"rejects %s original overlaps",
		(_name, mappings) => {
			expect(mapped(mappings)).toThrow(/partially overlap/);
		},
	);

	test("rejects generated overlap and accepts adjacent and zero-length ranges", () => {
		expect(
			mapped([
				[0, 2, 0, 2, 1],
				[1, 2, 2, 2, 1],
			]),
		).toThrow(/overlap at virtual/);
		expect(
			mapped([
				[0, 2, 0, 2, 0],
				[2, 0, 2, 0, 0],
				[2, 2, 2, 2, 0],
			]),
		).not.toThrow();
	});

	test("orders zero-length mappings before nonempty mappings at the same virtual start", () => {
		expect(
			mapped([
				[0, 2, 0, 2, 0],
				[0, 0, 2, 0, 0],
				[0, 0, 0, 0, 0],
			])().mappings,
		).toEqual([
			[0, 0, 0, 0, 0],
			[0, 0, 2, 0, 0],
			[0, 2, 0, 2, 0],
		]);
	});

	test.each([
		["negative", [-1, 1, 0, 1, 1]],
		["noninteger", [0.5, 1, 0, 1, 1]],
		["virtual out of bounds", [5, 2, 0, 1, 1]],
		["original out of bounds", [0, 1, 5, 2, 1]],
	] satisfies [string, SpanMapping][])(
		"rejects %s ranges",
		(_name, mapping) => {
			expect(mapped([mapping])).toThrow(/invalid or out-of-bounds/);
		},
	);

	test("throws when a verbatim mapping's texts differ", () => {
		expect(mapped([[1, 1, 1, 1, 0]], "ab", "ax")).toThrow(
			/verbatim but its texts differ/,
		);
		expect(mapped([[0, 2, 0, 1, 0]], "ab", "ab")).toThrow(
			/verbatim but its texts differ/,
		);
	});
});
