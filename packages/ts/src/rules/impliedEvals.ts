import {
	type AST,
	type Checker,
	getTSNodeRange,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as tsutils from "ts-api-utils";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";
import { isBuiltinSymbolLike } from "./utils/isBuiltinSymbolLike.ts";

const globalCandidates = new Set(["global", "globalThis", "window"]);
const evalLikeFunctions = new Set([
	"execScript",
	"setImmediate",
	"setInterval",
	"setTimeout",
]);

// TODO: Use a util like getStaticValue
// https://github.com/flint-fyi/flint/issues/1298
function getCalleeName(node: AST.Expression) {
	switch (node.kind) {
		case ts.SyntaxKind.ElementAccessExpression:
			if (
				ts.isIdentifier(node.expression) &&
				globalCandidates.has(node.expression.text) &&
				ts.isStringLiteral(node.argumentExpression)
			) {
				return node.argumentExpression.text;
			}
			break;

		case ts.SyntaxKind.Identifier:
			return node.text;

		case ts.SyntaxKind.PropertyAccessExpression:
			if (
				ts.isIdentifier(node.expression) &&
				globalCandidates.has(node.expression.text)
			) {
				return node.name.text;
			}
			break;
	}

	return undefined;
}

// TODO: Use a util like getStaticValue
// https://github.com/flint-fyi/flint/issues/1298
function isBind(node: AST.AnyNode) {
	switch (node.kind) {
		case ts.SyntaxKind.Identifier:
			return node.text === "bind";

		case ts.SyntaxKind.PropertyAccessExpression:
			return isBind(node.name);

		default:
			return false;
	}
}

function isDefinitelyString(type: ts.Type) {
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
			return (
				!isDefinitelyString(type) && isFunctionType(node, typeChecker, program)
			);
		}
	}
}

function isFunctionType(
	node: AST.AnyNode,
	typeChecker: Checker,
	program: ts.Program,
): boolean {
	const type = typeChecker.getTypeAtLocation(node);

	if (
		tsutils.isTypeFlagSet(type, ts.TypeFlags.Any | ts.TypeFlags.Unknown) ||
		isBuiltinSymbolLike(program, type, "Function")
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

	const signatures = typeChecker.getSignaturesOfType(
		type,
		ts.SignatureKind.Call,
	);

	return signatures.length > 0;
}

function isReferenceToGlobalFunction(
	node: AST.CallExpression | AST.NewExpression,
	typeChecker: Checker,
): boolean {
	if (
		ts.isPropertyAccessExpression(node.expression) ||
		ts.isElementAccessExpression(node.expression)
	) {
		return true;
	}

	const symbol = typeChecker.getSymbolAtLocation(node.expression);
	if (!symbol) {
		return true;
	}

	return !!symbol.getDeclarations()?.some((declaration) => {
		const sourceFile = declaration.getSourceFile();
		return (
			sourceFile.hasNoDefaultLib ||
			sourceFile.fileName.includes("node_modules/@types/node/") ||
			/\/lib\.[^/]*\.d\.ts$/.test(sourceFile.fileName)
		);
	});
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports using string arguments in setTimeout, setInterval, setImmediate, execScript, or the Function constructor.",
		id: "impliedEvals",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		functionConstructor: {
			primary:
				"Avoid using the unsafe Function constructor to create functions.",
			secondary: [
				"The Function constructor evaluates strings as code, similar to eval().",
				"This makes the code harder to analyze, optimize, and can introduce security vulnerabilities.",
			],
			suggestions: ["Use a function expression or arrow function instead."],
		},
		impliedEval: {
			primary:
				"Avoid passing unsafe strings to {{ name }}; pass a function instead.",
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
		function checkCalleeFunction(
			node: AST.CallExpression | AST.NewExpression,
			{ program, sourceFile, typeChecker }: TypeScriptFileServices,
		) {
			if (!node.arguments?.length) {
				return;
			}

			const type = typeChecker.getTypeAtLocation(node.expression);
			if (!isBuiltinSymbolLike(program, type, "FunctionConstructor")) {
				return;
			}

			context.report({
				message: "functionConstructor",
				range: getTSNodeRange(node.expression, sourceFile),
			});
		}

		function checkCalleeEval(
			node: AST.CallExpression | AST.NewExpression,
			calleeName: string,
			{ program, sourceFile, typeChecker }: TypeScriptFileServices,
		) {
			const args = node.arguments;
			if (!args?.length) {
				return;
			}

			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const handler = args[0]!;

			if (
				!evalLikeFunctions.has(calleeName) ||
				isFunction(handler, typeChecker, program) ||
				!isReferenceToGlobalFunction(node, typeChecker)
			) {
				return;
			}

			context.report({
				data: { name: calleeName },
				message: "impliedEval",
				range: getTSNodeRange(handler, sourceFile),
			});
		}

		function checkNode(
			node: AST.CallExpression | AST.NewExpression,
			services: TypeScriptFileServices,
		) {
			const calleeName = getCalleeName(node.expression);

			switch (calleeName) {
				case "Function":
					checkCalleeFunction(node, services);
					break;
				case undefined:
					return;
				default:
					checkCalleeEval(node, calleeName, services);
					break;
			}
		}

		return {
			visitors: {
				CallExpression: checkNode,
				NewExpression: checkNode,
			},
		};
	},
});
