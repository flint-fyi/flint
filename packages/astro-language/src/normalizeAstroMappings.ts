import { SpanMappingKind, type SpanMapping } from "@flint.fyi/content-mapper";
import { nullThrows } from "@flint.fyi/utils";

import { featuresFor, type VolarMappingData } from "./featuresFor.ts";

interface Candidate {
	exact: boolean;
	features: number;
	generatedLength: number;
	generatedOffset: number;
	length: number;
	sourceOffset: number;
}

interface SourceRange {
	end: number;
	start: number;
}

/** The parts of a Volar `CodeMapping`, as astro2tsx returns them, that span mappings use. */
interface VolarMapping {
	data: VolarMappingData;
	generatedLengths?: number[];
	generatedOffsets: number[];
	lengths: number[];
	sourceOffsets: number[];
}

/**
 * Converts astro2tsx's Volar mappings to span mappings.
 * astro2tsx can map one authored range several ways, so when ranges overlap,
 * exact and then longer mappings win.
 */
export function normalizeAstroMappings(
	mappings: VolarMapping[],
	generatedText: string,
	originalText: string,
): SpanMapping[] {
	const candidates = mappings.flatMap((mapping) => {
		const features = featuresFor(mapping.data);
		return mapping.generatedOffsets.map((generatedOffset, index): Candidate => {
			const length = mapping.lengths[index];
			const sourceOffset = mapping.sourceOffsets[index];
			const generatedLength = mapping.generatedLengths
				? mapping.generatedLengths[index]
				: length;
			if (
				length === undefined ||
				sourceOffset === undefined ||
				generatedLength === undefined
			) {
				throw new Error("Astro mapping arrays must have equal lengths");
			}
			return {
				exact:
					generatedLength === length &&
					generatedText.slice(
						generatedOffset,
						generatedOffset + generatedLength,
					) === originalText.slice(sourceOffset, sourceOffset + length),
				features,
				generatedLength,
				generatedOffset,
				length,
				sourceOffset,
			};
		});
	});
	candidates.sort(
		(left, right) =>
			Number(right.exact) - Number(left.exact) || right.length - left.length,
	);

	const selectedOriginal: SourceRange[] = [];
	const selectedVirtual: SourceRange[] = [];
	const normalized: SpanMapping[] = [];
	for (const candidate of candidates) {
		const original = {
			end: candidate.sourceOffset + candidate.length,
			start: candidate.sourceOffset,
		};
		const virtual = {
			end: candidate.generatedOffset + candidate.generatedLength,
			start: candidate.generatedOffset,
		};
		// Original ranges may repeat exactly, but virtual ranges may not overlap
		// at all: astro2tsx can also map a range a second time, extended over the
		// scaffolding that follows it.
		if (
			overlapsSelected(selectedOriginal, original, true) ||
			overlapsSelected(selectedVirtual, virtual, false)
		) {
			continue;
		}
		insertSelected(selectedOriginal, original);
		insertSelected(selectedVirtual, virtual);
		normalized.push([
			candidate.generatedOffset,
			candidate.generatedLength,
			candidate.sourceOffset,
			candidate.length,
			candidate.exact ? SpanMappingKind.Verbatim : SpanMappingKind.Atom,
			candidate.features,
		]);
	}
	return normalized;
}

function firstIndexWhere(
	ranges: SourceRange[],
	predicate: (range: SourceRange) => boolean,
): number {
	let low = 0;
	let high = ranges.length;
	while (low < high) {
		const middle = Math.floor((low + high) / 2);
		if (predicate(nullThrows(ranges[middle], "Expected a range in bounds"))) {
			high = middle;
		} else {
			low = middle + 1;
		}
	}
	return low;
}

function insertSelected(selected: SourceRange[], range: SourceRange): void {
	selected.splice(
		firstIndexWhere(
			selected,
			(other) =>
				other.start > range.start ||
				(other.start === range.start && other.end > range.end),
		),
		0,
		range,
	);
}

/**
 * Selected ranges never overlap one another, so sorted by start their ends
 * never decrease: the last range starting before a candidate ends is the only
 * one that can overlap it.
 */
function overlapsSelected(
	selected: SourceRange[],
	{ end, start }: SourceRange,
	allowIdentical: boolean,
): boolean {
	const previous =
		selected[firstIndexWhere(selected, (range) => range.start >= end) - 1];
	return (
		!!previous &&
		previous.end > start &&
		!(allowIdentical && previous.start === start && previous.end === end)
	);
}
