import {
	SpanMappingFeature,
	SpanMappingKind,
	type SpanMapping,
} from "@flint.fyi/content-mapper";
import { nullThrows } from "@flint.fyi/utils";

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
	data: {
		completion?: boolean | object;
		format?: boolean;
		navigation?:
			| boolean
			| { shouldHighlight?: () => boolean; shouldRename?: () => boolean };
		semantic?: boolean | { shouldHighlight?: () => boolean };
		structure?: boolean;
		verification?: boolean | object;
	};
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

/**
 * The span-mapping features each Volar capability enables.
 * Volar's flags are coarser than TypeScript's, so each one fans out to every
 * operation it covers.
 */
const SEMANTIC_FEATURES =
	SpanMappingFeature.Hover |
	SpanMappingFeature.InlayHints |
	SpanMappingFeature.SemanticTokens |
	SpanMappingFeature.CodeLens;
const COMPLETION_FEATURES =
	SpanMappingFeature.SignatureHelp |
	SpanMappingFeature.Completion |
	SpanMappingFeature.AutoInsert;
const NAVIGATION_FEATURES =
	SpanMappingFeature.Definition |
	SpanMappingFeature.TypeDefinition |
	SpanMappingFeature.Implementation |
	SpanMappingFeature.References |
	SpanMappingFeature.DocumentHighlights |
	SpanMappingFeature.Rename |
	SpanMappingFeature.CallHierarchy |
	SpanMappingFeature.CodeActions;
const VERIFICATION_FEATURES = SpanMappingFeature.CodeActions;
const FORMAT_FEATURES = SpanMappingFeature.Formatting;
const STRUCTURE_FEATURES =
	SpanMappingFeature.FoldingRanges |
	SpanMappingFeature.SelectionRanges |
	SpanMappingFeature.LinkedEditing |
	SpanMappingFeature.DocumentSymbols;

export function featuresFor(data: VolarMapping["data"]): number {
	let features = 0;
	if (data.semantic) {
		features |= SEMANTIC_FEATURES;
		if (
			typeof data.semantic === "object" &&
			data.semantic.shouldHighlight?.() === false
		) {
			features &= ~SpanMappingFeature.SemanticTokens;
		}
	}
	if (data.completion) {
		features |= COMPLETION_FEATURES;
	}
	if (data.navigation) {
		features |= NAVIGATION_FEATURES;
		if (typeof data.navigation === "object") {
			if (data.navigation.shouldHighlight?.() === false) {
				features &= ~SpanMappingFeature.DocumentHighlights;
			}
			if (data.navigation.shouldRename?.() === false) {
				features &= ~SpanMappingFeature.Rename;
			}
		}
	}
	if (data.verification) {
		features |= VERIFICATION_FEATURES;
	}
	if (data.format) {
		features |= FORMAT_FEATURES;
	}
	if (data.structure) {
		features |= STRUCTURE_FEATURES;
	}
	return features;
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
