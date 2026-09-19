import type { CodeInformation, CodeMapping } from "@volar/language-core";

import {
	SPAN_MAPPING_FEATURE_ALL,
	SpanMappingFeature,
	SpanMappingKind,
	type SpanMapping,
	type TransformParams,
	type TransformResult,
} from "./protocol.ts";

export interface ContentMapperTransformSource {
	extension: string;
	mappings: Pick<
		CodeMapping,
		| "data"
		| "generatedLengths"
		| "generatedOffsets"
		| "lengths"
		| "sourceOffsets"
	>[];
	text: string;
}

export function createContentMapperTransform({
	extension,
	mappings,
	text,
}: ContentMapperTransformSource): (params: TransformParams) => TransformResult {
	return ({ content }) => {
		const flattened = mappings
			.flatMap((mapping): SpanMapping[] => {
				const count = mapping.generatedOffsets.length;
				if (
					mapping.sourceOffsets.length !== count ||
					mapping.lengths.length !== count ||
					(mapping.generatedLengths !== undefined &&
						mapping.generatedLengths.length !== count)
				) {
					throw new Error(
						"Content mapper mapping parallel arrays must have equal lengths",
					);
				}
				return mapping.generatedOffsets.map((generatedStart, index) => {
					const originalStart = mapping.sourceOffsets[index];
					const originalLength = mapping.lengths[index];
					if (originalStart === undefined || originalLength === undefined) {
						throw new Error(
							`Content mapper mapping ${index} is missing a source offset or length`,
						);
					}
					const virtualLength =
						mapping.generatedLengths?.[index] ?? originalLength;
					if (
						![
							generatedStart,
							virtualLength,
							originalStart,
							originalLength,
						].every((value) => Number.isInteger(value) && value >= 0) ||
						generatedStart + virtualLength > text.length ||
						originalStart + originalLength > content.length
					) {
						throw new Error(
							`Content mapper mapping ${index} has an invalid or out-of-bounds range`,
						);
					}
					const isExact =
						virtualLength === originalLength &&
						text.slice(generatedStart, generatedStart + virtualLength) ===
							content.slice(originalStart, originalStart + originalLength);
					const kind = isExact
						? SpanMappingKind.Verbatim
						: SpanMappingKind.Atom;
					const features = featuresFor(mapping.data);
					return features === SPAN_MAPPING_FEATURE_ALL
						? [
								generatedStart,
								virtualLength,
								originalStart,
								originalLength,
								kind,
							]
						: [
								generatedStart,
								virtualLength,
								originalStart,
								originalLength,
								kind,
								features,
							];
				});
			})
			.sort(
				(left, right) =>
					left[0] - right[0] ||
					Number(left[1] !== 0) - Number(right[1] !== 0) ||
					left[2] - right[2] ||
					left[3] - right[3] ||
					left[4] - right[4] ||
					(left[5] ?? SPAN_MAPPING_FEATURE_ALL) -
						(right[5] ?? SPAN_MAPPING_FEATURE_ALL),
			);
		const nonOverlapping: SpanMapping[] = [];
		for (const mapping of flattened) {
			const previous = nonOverlapping.at(-1);
			if (previous && mapping[0] < previous[0] + previous[1]) {
				throw new Error(
					`Content mapper mappings overlap at virtual offset ${mapping[0]}`,
				);
			}
			nonOverlapping.push(mapping);
		}
		const originalSorted = [...nonOverlapping].sort(
			(left, right) => left[2] - right[2] || left[3] - right[3],
		);
		let previous = originalSorted[0];
		for (const current of originalSorted.slice(1)) {
			if (
				previous &&
				current[2] < previous[2] + previous[3] &&
				(current[2] !== previous[2] || current[3] !== previous[3])
			) {
				throw new Error(
					`Content mapper mappings partially overlap at original offset ${current[2]}`,
				);
			}
			previous = current;
		}
		return { extension, mappings: nonOverlapping, text };
	};
}

/**
 * The TypeScript span-mapping features each Volar {@link CodeInformation}
 * capability enables. Volar's flags are coarser than TypeScript's, so each one
 * fans out to every operation it covers.
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

function featuresFor(data: CodeInformation | undefined): number {
	if (!data) {
		return SPAN_MAPPING_FEATURE_ALL;
	}
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
