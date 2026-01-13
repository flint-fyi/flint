import * as tsutils from "ts-api-utils";
import * as ts from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";
import type * as AST from "../types/ast.ts";
import type { Checker } from "../types/checker.ts";
import { isBuiltinSymbolLike } from "./utils/isBuiltinSymbolLike.ts";

const FUNCTION_CONSTRUCTOR = "Function";
const GLOBAL_CANDIDATES = new Set(["global", "globalThis", "window"]);
const EVAL_LIKE_FUNCTIONS = new Set([
	"execScript",
	"setImmediate",
	"setInterval",
	"setTimeout",
]);

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports using string arguments in setTimeout, setInterval, setImmediate, execScript, or the Function constructor.",
		id: "impliedEvals",
		preset: "logical",
	},
	messages: {
		functionConstructor: {
			primary: "Avoid using the Function constructor to create functions.",
			secondary: [
				"The Function constructor evaluates strings as code, similar to eval().",
				"This makes the code harder to analyze, optimize, and can introduce security vulnerabilities.",
			],
			suggestions: ["Use a function expression or arrow function instead."],
		},
		impliedEval: {
			primary: "Avoid passing strings to {{ name }}; pass a function instead.",
			secondary: [
				"Passing a string to {{ name }} causes it to be evaluated as code, similar to eval().",
				"This makes the code harder to analyze, optimize, and can introduce security vulnerabilities.",
			],
			suggestions: [
				"Pass a function expression or arrow function as the first argument.",
			],
		},
	},
	setup(context) {
		function getCalleeName(node: AST.Expression): string | undefined {
			if (ts.isIdentifier(node)) {
				return node.text;
			}

			if (
				ts.isPropertyAccessExpression(node) &&
				ts.isIdentifier(node.expression) &&
				GLOBAL_CANDIDATES.has(node.expression.text)
			) {
				return node.name.text;
			}

			if (
				ts.isElementAccessExpression(node) &&
				ts.isIdentifier(node.expression) &&
				GLOBAL_CANDIDATES.has(node.expression.text) &&
				ts.isStringLiteral(node.argumentExpression)
			) {
				return node.argumentExpression.text;
			}

			return undefined;
		}

		function isFunctionType(
			node: AST.AnyNode,
			typeChecker: Checker,
			program: ts.Program,
		): boolean {
			const type = typeChecker.getTypeAtLocation(node);

			if (
				tsutils.isTypeFlagSet(type, ts.TypeFlags.Any | ts.TypeFlags.Unknown)
			) {
				return true;
			}

			const symbol = type.getSymbol();

			if (
				symbol &&
				tsutils.isSymbolFlagSet(
					symbol,
					ts.SymbolFlags.Function | ts.SymbolFlags.Method,
				)
			) {
				return true;
			}

			if (isBuiltinSymbolLike(program, type, FUNCTION_CONSTRUCTOR)) {
				return true;
			}

			const signatures = typeChecker.getSignaturesOfType(
				type,
				ts.SignatureKind.Call,
			);

			return signatures.length > 0;
		}

		function isBind(node: AST.AnyNode): boolean {
			if (ts.isPropertyAccessExpression(node)) {
				return isBind(node.name);
			}

			return ts.isIdentifier(node) && node.text === "bind";
		}

		function isDefinitelyString(type: ts.Type): boolean {
			if (
				tsutils.isTypeFlagSet(
					type,
					ts.TypeFlags.Any | ts.TypeFlags.Unknown | ts.TypeFlags.Never,
				)
			) {
				return false;
			}

			if (type.isUnion()) {
				return type.types.every(isDefinitelyString);
			}

			return tsutils.isTypeFlagSet(type, ts.TypeFlags.StringLike);
		}

		function isFunction(
			node: AST.AnyNode,
			typeChecker: Checker,
			program: ts.Program,
		): boolean {
			switch (node.kind) {
				case ts.SyntaxKind.ArrowFunction:
				case ts.SyntaxKind.FunctionDeclaration:
				case ts.SyntaxKind.FunctionExpression:
					return true;

				case ts.SyntaxKind.CallExpression:
					if (isBind(node.expression)) {
						return true;
					}
					return (
						!isDefinitelyString(typeChecker.getTypeAtLocation(node)) &&
						isFunctionType(node, typeChecker, program)
					);

				case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
				case ts.SyntaxKind.StringLiteral:
				case ts.SyntaxKind.TemplateExpression:
					return false;

				default: {
					const type = typeChecker.getTypeAtLocation(node);
					if (isDefinitelyString(type)) {
						return false;
					}
					return isFunctionType(node, typeChecker, program);
				}
			}
		}

		function isReferenceToGlobalFunction(
			node: AST.CallExpression | AST.NewExpression,
			typeChecker: Checker,
		): boolean {
			const expressionNode = node.expression;

			if (
				ts.isPropertyAccessExpression(expressionNode) ||
				ts.isElementAccessExpression(expressionNode)
			) {
				return true;
			}

			const symbol = typeChecker.getSymbolAtLocation(expressionNode);

			if (!symbol) {
				return true;
			}

			const declarations = symbol.getDeclarations();

			if (!declarations?.length) {
				return true;
			}

			const hasUserFunctionDeclaration = declarations.some((declaration) => {
				if (!ts.isFunctionDeclaration(declaration)) {
					return false;
				}

				const modifiers = ts.getModifiers(declaration);
				const hasDeclareModifier = modifiers?.some(
					(m) => m.kind === ts.SyntaxKind.DeclareKeyword,
				);

				if (hasDeclareModifier) {
					return false;
				}

				const sourceFile = declaration.getSourceFile();
				if (
					sourceFile.hasNoDefaultLib ||
					/\/lib\.[^/]*\.d\.ts$/.test(sourceFile.fileName)
				) {
					return false;
				}

				return true;
			});

			return !hasUserFunctionDeclaration;
		}

		function checkImpliedEval(
			node: AST.CallExpression | AST.NewExpression,
			sourceFile: ts.SourceFile,
			typeChecker: Checker,
			program: ts.Program,
		) {
			const calleeName = getCalleeName(node.expression);
			if (!calleeName) {
				return;
			}

			if (calleeName === FUNCTION_CONSTRUCTOR) {
				const args = node.arguments;
				if (!args?.length) {
					return;
				}

				const type = typeChecker.getTypeAtLocation(node.expression);
				if (isBuiltinSymbolLike(program, type, "FunctionConstructor")) {
					context.report({
						message: "functionConstructor",
						range: getTSNodeRange(node.expression, sourceFile),
					});
				}
				return;
			}

			const args = node.arguments;
			if (!args?.length) {
				return;
			}

			const handler = args[0];
			if (
				handler &&
				EVAL_LIKE_FUNCTIONS.has(calleeName) &&
				!isFunction(handler, typeChecker, program) &&
				isReferenceToGlobalFunction(node, typeChecker)
			) {
				context.report({
					data: { name: calleeName },
					message: "impliedEval",
					range: getTSNodeRange(handler, sourceFile),
				});
			}
		}

		return {
			visitors: {
				CallExpression: (node, { program, sourceFile, typeChecker }) => {
					checkImpliedEval(node, sourceFile, typeChecker, program);
				},
				NewExpression: (node, { program, sourceFile, typeChecker }) => {
					checkImpliedEval(node, sourceFile, typeChecker, program);
				},
			},
		};
	},
});
