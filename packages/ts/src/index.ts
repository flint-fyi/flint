export { convertTypeScriptDiagnosticToLanguageFileDiagnostic } from "./convertTypeScriptDiagnosticToLanguageFileDiagnostic.ts";
export {
	collectTypeScriptFileCacheImpacts,
	NodeSyntaxKinds,
} from "./createTypeScriptFileFromProgram.ts";
export {
	extractDirectivesFromTypeScriptFile,
	type ExtractedDirective,
} from "./directives/parseDirectivesFromTypeScriptFile.ts";
export { getTSNodeRange } from "./getTSNodeRange.ts";
export * from "./language.ts";
export type { TypeScriptNodesByName } from "./nodes.ts";
export { ts } from "./plugin.ts";
export {
	prepareTypeScriptBasedLanguage,
	type TypeScriptBasedLanguageFile,
	type TypeScriptBasedLanguageFileFactoryDefinition,
} from "./prepareTypeScriptBasedLanguage.ts";
export type * as AST from "./types/ast.ts";
export type { Checker } from "./types/checker.ts";
export { getDeclarationsIfGlobal } from "./utils/getDeclarationsIfGlobal.ts";
export { isGlobalDeclaration } from "./utils/isGlobalDeclaration.ts";
export { isGlobalDeclarationOfName } from "./utils/isGlobalDeclarationOfName.ts";
export { isGlobalVariable } from "./utils/isGlobalVariable.ts";
