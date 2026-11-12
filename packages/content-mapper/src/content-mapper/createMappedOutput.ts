import {
	SPAN_MAPPING_FEATURE_ALL,
	SpanMappingKind,
	type MappedOutput,
	type SpanMapping,
} from "./protocol.ts";

export interface MappedOutputSource {
	/** The authored text that the mappings' original ranges point into. */
	content: string;
	extension: string;
	mappings: SpanMapping[];
	text: string;
}

/**
 * Validates and orders a mapper's span mappings into protocol output.
 * Throws on out-of-bounds or overlapping ranges, and on verbatim mappings whose
 * virtual and original texts differ.
 */
export function createMappedOutput({
	content,
	extension,
	mappings,
	text,
}: MappedOutputSource): MappedOutput {
	const sorted = mappings
		.map((mapping, index): SpanMapping => {
			const [
				virtualStart,
				virtualLength,
				originalStart,
				originalLength,
				kind,
				features,
			] = mapping;
			if (
				[virtualStart, virtualLength, originalStart, originalLength].some(
					(value) => !(Number.isInteger(value) && value >= 0),
				) ||
				virtualStart + virtualLength > text.length ||
				originalStart + originalLength > content.length
			) {
				throw new Error(
					`Content mapper mapping ${index} has an invalid or out-of-bounds range`,
				);
			}
			if (
				kind === SpanMappingKind.Verbatim &&
				(virtualLength !== originalLength ||
					text.slice(virtualStart, virtualStart + virtualLength) !==
						content.slice(originalStart, originalStart + originalLength))
			) {
				throw new Error(
					`Content mapper mapping ${index} is verbatim but its texts differ`,
				);
			}
			return features === SPAN_MAPPING_FEATURE_ALL
				? [virtualStart, virtualLength, originalStart, originalLength, kind]
				: mapping;
		})
		.toSorted(
			(left, right) =>
				left[0] - right[0] ||
				Number(left[1] !== 0) - Number(right[1] !== 0) ||
				left[2] - right[2] ||
				left[3] - right[3] ||
				left[4] - right[4] ||
				(left[5] ?? SPAN_MAPPING_FEATURE_ALL) -
					(right[5] ?? SPAN_MAPPING_FEATURE_ALL),
		);
	for (const [index, mapping] of sorted.entries()) {
		const previous = sorted[index - 1];
		if (previous && mapping[0] < previous[0] + previous[1]) {
			throw new Error(
				`Content mapper mappings overlap at virtual offset ${mapping[0]}`,
			);
		}
	}
	const originalSorted = sorted.toSorted(
		(left, right) => left[2] - right[2] || left[3] - right[3],
	);
	for (const [index, current] of originalSorted.entries()) {
		const previous = originalSorted[index - 1];
		if (
			previous &&
			current[2] < previous[2] + previous[3] &&
			(current[2] !== previous[2] || current[3] !== previous[3])
		) {
			throw new Error(
				`Content mapper mappings partially overlap at original offset ${current[2]}`,
			);
		}
	}
	return { extension, mappings: sorted, text };
}
