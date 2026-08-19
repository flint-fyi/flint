import { createRequire } from "node:module";
import type * as ts from "typescript";

// Importing `typescript` from ESM makes Node run cjs-module-lexer over all ~9MB
// of it to enumerate named exports, work `enableCompileCache()` does not cover.
// `require` skips it, so all internal value access goes through this module.
const require = createRequire(import.meta.url);

const typescript = require("typescript") as typeof ts;

export default typescript;

export type NodeFlags = ts.NodeFlags;
export type ScriptKind = ts.ScriptKind;
export type ScriptTarget = ts.ScriptTarget;
export type SignatureKind = ts.SignatureKind;
export type SymbolFlags = ts.SymbolFlags;
export type SyntaxKind = ts.SyntaxKind;
export type TypeFlags = ts.TypeFlags;

export const NodeFlags: typeof ts.NodeFlags = typescript.NodeFlags;
export const ScriptKind: typeof ts.ScriptKind = typescript.ScriptKind;
export const ScriptTarget: typeof ts.ScriptTarget = typescript.ScriptTarget;
export const SignatureKind: typeof ts.SignatureKind = typescript.SignatureKind;
export const SymbolFlags: typeof ts.SymbolFlags = typescript.SymbolFlags;
export const SyntaxKind: typeof ts.SyntaxKind = typescript.SyntaxKind;
export const TypeFlags: typeof ts.TypeFlags = typescript.TypeFlags;

export const createSourceFile: typeof ts.createSourceFile =
	typescript.createSourceFile;
export const forEachChild: typeof ts.forEachChild = typescript.forEachChild;
export const getLeadingCommentRanges: typeof ts.getLeadingCommentRanges =
	typescript.getLeadingCommentRanges;
export const getPreEmitDiagnostics: typeof ts.getPreEmitDiagnostics =
	typescript.getPreEmitDiagnostics;
export const getTrailingCommentRanges: typeof ts.getTrailingCommentRanges =
	typescript.getTrailingCommentRanges;
export const isArrayLiteralExpression: typeof ts.isArrayLiteralExpression =
	typescript.isArrayLiteralExpression;
export const isBigIntLiteral: typeof ts.isBigIntLiteral =
	typescript.isBigIntLiteral;
export const isClassDeclaration: typeof ts.isClassDeclaration =
	typescript.isClassDeclaration;
export const isElementAccessExpression: typeof ts.isElementAccessExpression =
	typescript.isElementAccessExpression;
export const isExpressionWithTypeArguments: typeof ts.isExpressionWithTypeArguments =
	typescript.isExpressionWithTypeArguments;
export const isFunctionDeclaration: typeof ts.isFunctionDeclaration =
	typescript.isFunctionDeclaration;
export const isFunctionLike: typeof ts.isFunctionLike =
	typescript.isFunctionLike;
export const isIdentifier: typeof ts.isIdentifier = typescript.isIdentifier;
export const isInterfaceDeclaration: typeof ts.isInterfaceDeclaration =
	typescript.isInterfaceDeclaration;
export const isLiteralExpression: typeof ts.isLiteralExpression =
	typescript.isLiteralExpression;
export const isNewExpression: typeof ts.isNewExpression =
	typescript.isNewExpression;
export const isNumericLiteral: typeof ts.isNumericLiteral =
	typescript.isNumericLiteral;
export const isParenthesizedExpression: typeof ts.isParenthesizedExpression =
	typescript.isParenthesizedExpression;
export const isPrefixUnaryExpression: typeof ts.isPrefixUnaryExpression =
	typescript.isPrefixUnaryExpression;
export const isPropertyAccessExpression: typeof ts.isPropertyAccessExpression =
	typescript.isPropertyAccessExpression;
export const isPropertySignature: typeof ts.isPropertySignature =
	typescript.isPropertySignature;
export const isShorthandPropertyAssignment: typeof ts.isShorthandPropertyAssignment =
	typescript.isShorthandPropertyAssignment;
export const isSpreadElement: typeof ts.isSpreadElement =
	typescript.isSpreadElement;
export const isStringLiteral: typeof ts.isStringLiteral =
	typescript.isStringLiteral;
export const isTypeNode: typeof ts.isTypeNode = typescript.isTypeNode;
export const isTypeParameterDeclaration: typeof ts.isTypeParameterDeclaration =
	typescript.isTypeParameterDeclaration;
export const isVariableDeclaration: typeof ts.isVariableDeclaration =
	typescript.isVariableDeclaration;
