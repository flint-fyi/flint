export {
	type ContentMapperTransformSource,
	createContentMapperTransform,
} from "./content-mapper/createContentMapperTransform.ts";
export {
	type ContentMapperProject,
	type ContentMapperTransform,
	type DiagnosticDirectives,
	type MappedDiagnosticDirective,
	type MappedOutput,
	type MapperDiagnostic,
	type OpenProjectParams,
	type OptionDiagnostic,
	type PositionEncoding,
	type RunContentMapperOptions,
	type SpanMapping,
	TRANSFORM_FAILURE_CODE,
	type TransformParams,
	type TransformResult,
} from "./content-mapper/protocol.ts";
export {
	isModuleEntry,
	runContentMapper,
} from "./content-mapper/runContentMapper.ts";
export { reportSourceCode } from "./language.ts";
