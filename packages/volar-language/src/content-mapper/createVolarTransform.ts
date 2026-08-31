import type { CodeInformation, CodeMapping } from "@volar/language-core";

import type { ContentMapperTransform, SpanMapping } from "./protocol.ts";

export interface VolarTransformSource {
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

export function createVolarTransform({
	extension,
	mappings,
	text,
}: VolarTransformSource): ContentMapperTransform {
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
						"Volar mapping parallel arrays must have equal lengths",
					);
				}
				return mapping.generatedOffsets.map((generatedStart, index) => {
					const originalStart = mapping.sourceOffsets[index];
					const originalLength = mapping.lengths[index];
					if (originalStart === undefined || originalLength === undefined) {
						throw new Error(
							`Volar mapping ${index} is missing a source offset or length`,
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
							`Volar mapping ${index} has an invalid or out-of-bounds range`,
						);
					}
					const isExact =
						virtualLength === originalLength &&
						text.slice(generatedStart, generatedStart + virtualLength) ===
							content.slice(originalStart, originalStart + originalLength);
					const features = featuresFor(mapping.data);
					return [
						generatedStart,
						virtualLength,
						originalStart,
						originalLength,
						isExact ? 0 : 1,
						...(features === FEATURE_ALL ? [] : [features]),
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
					(left[5] ?? FEATURE_ALL) - (right[5] ?? FEATURE_ALL),
			);
		const nonOverlapping: SpanMapping[] = [];
		for (const mapping of flattened) {
			const previous = nonOverlapping.at(-1);
			if (previous && mapping[0] < previous[0] + previous[1]) {
				throw new Error(
					`Volar mappings overlap at virtual offset ${mapping[0]}`,
				);
			}
			nonOverlapping.push(mapping);
		}
		const originalSorted = [...nonOverlapping].sort(
			(left, right) => left[2] - right[2] || left[3] - right[3],
		);
		for (let index = 1; index < originalSorted.length; index += 1) {
			const previous = originalSorted[index - 1];
			const current = originalSorted[index];
			if (
				current[2] < previous[2] + previous[3] &&
				(current[2] !== previous[2] || current[3] !== previous[3])
			) {
				throw new Error(
					`Volar mappings partially overlap at original offset ${current[2]}`,
				);
			}
		}
		return { extension, mappings: nonOverlapping, text };
	};
}

const FEATURE_ALL = (1 << 20) - 1;

function featuresFor(data: CodeInformation | undefined): number {
	if (!data) {
		return FEATURE_ALL;
	}
	let features = 0;
	if (data.semantic) {
		features |= (1 << 0) | (1 << 12) | (1 << 13) | (1 << 19);
		if (
			typeof data.semantic === "object" &&
			data.semantic.shouldHighlight?.() === false
		) {
			features &= ~(1 << 13);
		}
	}
	if (data.completion) {
		features |= (1 << 1) | (1 << 2) | (1 << 17);
	}
	if (data.navigation) {
		features |= 0b1111111_1000;
		if (typeof data.navigation === "object") {
			if (data.navigation.shouldHighlight?.() === false) {
				features &= ~(1 << 7);
			}
			if (data.navigation.shouldRename?.() === false) {
				features &= ~(1 << 8);
			}
		}
	}
	if (data.verification) {
		features |= 1 << 10;
	}
	if (data.format) {
		features |= 1 << 11;
	}
	if (data.structure) {
		features |= (1 << 14) | (1 << 15) | (1 << 16) | (1 << 18);
	}
	return features;
}
