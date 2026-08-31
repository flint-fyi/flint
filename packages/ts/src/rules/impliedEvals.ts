import { SyntaxKind } from "typescript-native/unstable/ast";
import {
	SymbolFlags,
	TypeFlags,
	type Program,
	type Type,
} from "typescript-native/unstable/sync";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
	type Checker,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

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
		case SyntaxKind.ElementAccessExpression:
			if (
				node.expression.kind === SyntaxKind.Identifier &&
				globalCandidates.has(node.expression.text) &&
				node.argumentExpression.kind === SyntaxKind.StringLiteral
			) {
				return node.argumentExpression.text;
			}
			break;

		case SyntaxKind.Identifier:
			return node.text;

		case SyntaxKind.PropertyAccessExpression:
			if (
				node.expression.kind === SyntaxKind.Identifier &&
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
		case SyntaxKind.Identifier:
			return node.text === "bind";

		case SyntaxKind.PropertyAccessExpression:
			return isBind(node.name);

		default:
			return false;
	}
}

function isDefinitelyString(type: Type): boolean {
	if (type.flags & (TypeFlags.Any | TypeFlags.Unknown | TypeFlags.Never)) {
		return false;
	}

	if (type.isUnionType()) {
		return type.getTypes().every(isDefinitelyString);
	}

	return (type.flags & TypeFlags.StringLike) !== 0;
}

function isFunction(
	node: AST.AnyNode,
	checker: Checker,
	program: Program,
): boolean {
	switch (node.kind) {
		case SyntaxKind.ArrowFunction:
		case SyntaxKind.FunctionDeclaration:
		case SyntaxKind.FunctionExpression:
			return true;

		case SyntaxKind.CallExpression:
			if (isBind(node.expression)) {
				return true;
			}
			return (
				!isDefinitelyString(checker.getTypeAtLocation(node)) &&
				isFunctionType(node, checker, program)
			);

		case SyntaxKind.NoSubstitutionTemplateLiteral:
		case SyntaxKind.StringLiteral:
		case SyntaxKind.TemplateExpression:
			return false;

		default: {
			const type = checker.getTypeAtLocation(node);
			return (
				!isDefinitelyString(type) && isFunctionType(node, checker, program)
			);
		}
	}
}

function isFunctionType(
	node: AST.AnyNode,
	checker: Checker,
	program: Program,
): boolean {
	const type = checker.getTypeAtLocation(node);

	if (
		(type.flags & (TypeFlags.Any | TypeFlags.Unknown)) !== 0 ||
		isBuiltinSymbolLike(program, type, "Function")
	) {
		return true;
	}

	const symbol = type.getSymbol();

	if (
		symbol &&
		(symbol.flags & (SymbolFlags.Function | SymbolFlags.Method)) !== 0
	) {
		return true;
	}

	return !!type.getCallSignatures().length;
}

function isReferenceToGlobalFunction(
	node: AST.CallExpression | AST.NewExpression,
	checker: Checker,
	program: Program,
): boolean {
	if (
		node.expression.kind === SyntaxKind.PropertyAccessExpression ||
		node.expression.kind === SyntaxKind.ElementAccessExpression
	) {
		return true;
	}

	const symbol = checker.getSymbolAtLocation(node.expression);
	if (!symbol) {
		return true;
	}

	return symbol.declarations.some((declarationHandle) => {
		const declaration = declarationHandle.resolve();
		if (!declaration) {
			return false;
		}
		const sourceFile = declaration.getSourceFile();
		return (
			program.isSourceFileDefaultLibrary(sourceFile) ||
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
			{ checker, program, sourceFile }: TypeScriptFileServices,
		) {
			if (!node.arguments?.length) {
				return;
			}

			const type = checker.getTypeAtLocation(node.expression);
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
			{ checker, program, sourceFile }: TypeScriptFileServices,
		) {
			const args = node.arguments;
			if (!args?.length) {
				return;
			}

			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const handler = args[0]!;

			if (
				!evalLikeFunctions.has(calleeName) ||
				isFunction(handler, checker, program) ||
				!isReferenceToGlobalFunction(node, checker, program)
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
