export {
	convertTypeScriptDiagnosticToLanguageReport,
	type TSDiagnostic,
} from "./convertTypeScriptDiagnosticToLanguageReport.ts";
export {
	extractDirectivesFromTypeScriptFile,
	type ExtractedDirective,
} from "./directives/parseDirectivesFromTypeScriptFile.ts";
export { getTSNodeRange } from "./getTSNodeRange.ts";
export {
	NodeSyntaxKinds,
	setVolarCreateFile,
	throwUnknownLanguageExtension,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "./language.ts";
export type { TypeScriptNodesByName, TypeScriptNodeVisitors } from "./nodes.ts";
export {
	createScopeManager,
	type FunctionWithParameters,
	getScopeManager,
	type Scope,
	type ScopeManager,
	type ScopeReference,
	type ScopeVariable,
} from "./scope/scopeManager.ts";
export type * as AST from "./types/ast.ts";
export type { Checker } from "./types/checker.ts";
export { createRuleTesterTSConfig } from "./utils/createRuleTesterTSConfig.ts";
export { declarationIncludesGlobal } from "./utils/declarationIncludesGlobal.ts";
export { forEachChild } from "./utils/forEachChild.ts";
export { getDeclarationsIfGlobal } from "./utils/getDeclarationsIfGlobal.ts";
export { getModifyingReferences } from "./utils/getModifyingReferences.ts";
export { hasSameTokens } from "./utils/hasSameTokens.ts";
export {
	type BuiltInArrayMethodNode,
	isBuiltinArrayMethod,
} from "./utils/isBuiltinArrayMethod.ts";
export { isFunction } from "./utils/isFunction.ts";
export { isGlobalDeclaration } from "./utils/isGlobalDeclaration.ts";
export { isGlobalDeclarationOfName } from "./utils/isGlobalDeclarationOfName.ts";
export { isGlobalVariable } from "./utils/isGlobalVariable.ts";
export { isInlineArrayCreation } from "./utils/isInlineArrayCreation.ts";
export { isStaticString } from "./utils/isStaticString.ts";
export { isStringRawNoSubstitution } from "./utils/isStringRawNoSubstitution.ts";
export { unwrapParenthesizedNode } from "./utils/unwrapParenthesizedNode.ts";
export { unwrapParentParenthesizedExpressions } from "./utils/unwrapParentParenthesizedExpressions.ts";
