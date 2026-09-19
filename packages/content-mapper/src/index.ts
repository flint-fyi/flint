export {
	type ContentMapperTransformSource,
	createContentMapperTransform,
} from "./content-mapper/createContentMapperTransform.ts";
export type {
	ContentMapperProject,
	ContentMapperTransform,
	DiagnosticDirectives,
	MappedDiagnosticDirective,
	MappedOutput,
	MapperDiagnostic,
	OpenProjectParams,
	OptionDiagnostic,
	PositionEncoding,
	RunContentMapperOptions,
	SpanMapping,
	TransformParams,
	TransformResult,
} from "./content-mapper/protocol.ts";
export { TRANSFORM_FAILURE_CODE } from "./content-mapper/protocol.ts";
export {
	isModuleEntry,
	runContentMapper,
} from "./content-mapper/runContentMapper.ts";
export { reportSourceCode } from "./language.ts";
