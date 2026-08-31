export {
	createVolarTransform,
	type VolarTransformSource,
} from "./content-mapper/createVolarTransform.ts";
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
export { runContentMapper } from "./content-mapper/runContentMapper.ts";
export { reportSourceCode } from "./language.ts";
