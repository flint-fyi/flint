export {
	createMappedOutput,
	type MappedOutputSource,
} from "./content-mapper/createMappedOutput.ts";
export {
	type ContentMapperProject,
	type ContentMapperTransform,
	type DiagnosticDirectives,
	type MappedDiagnosticDirective,
	type MappedOutput,
	type MapperDiagnostic,
	type OpenProjectParams,
	type OptionDiagnostic,
	type RunContentMapperOptions,
	type SpanMapping,
	TRANSFORM_FAILURE_CODE,
	type TransformParams,
	type TransformResult,
} from "./content-mapper/protocol.ts";
export {
	SPAN_MAPPING_FEATURE_ALL,
	SpanMappingFeature,
	SpanMappingKind,
} from "./content-mapper/protocol.ts";
export { runContentMapper } from "./content-mapper/runContentMapper.ts";
export { reportSourceCode } from "./language.ts";
