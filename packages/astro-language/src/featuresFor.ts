import { SpanMappingFeature } from "@flint.fyi/content-mapper";

/** The capabilities a Volar `CodeMapping` enables, as astro2tsx returns them. */
export interface VolarMappingData {
	completion?: boolean | object;
	format?: boolean;
	navigation?:
		boolean | { shouldHighlight?: () => boolean; shouldRename?: () => boolean };
	semantic?: boolean | { shouldHighlight?: () => boolean };
	structure?: boolean;
	verification?: boolean | object;
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

export function featuresFor(data: VolarMappingData): number {
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
