import { SyntaxKind } from "typescript-native/unstable/ast";
import type { Program } from "typescript-native/unstable/sync";

import {
	getTSNodeRange,
	isGlobalDeclaration,
	isGlobalDeclarationOfName,
	typescriptLanguage,
	type AST,
	type Checker,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports using the Function constructor to create functions from strings.",
		id: "functionNewCalls",
		presets: ["logical"],
	},
	messages: {
		noFunctionConstructor: {
			primary:
				"Dynamically creating functions with the Function constructor is insecure and slow.",
			secondary: [
				"Using the `Function` constructor to create functions from strings is similar to `eval()` and introduces security risks and performance issues.",
				"Code passed to the Function constructor is executed in the global scope, making it harder to optimize and potentially allowing arbitrary code execution if user input is involved.",
			],
			suggestions: [
				"Define functions using function declarations (`function name() {}`) or arrow functions (`() => {}`) instead.",
				"If dynamic code generation is truly necessary, consider safer alternatives like passing functions as parameters or using a more constrained domain-specific approach.",
			],
		},
	},
	setup(context) {
		function checkNode(
			node: AST.CallExpression | AST.NewExpression,
			{ program, sourceFile, checker }: TypeScriptFileServices,
		) {
			if (isFunctionConstructor(node, checker, program)) {
				context.report({
					message: "noFunctionConstructor",
					range: getTSNodeRange(node.expression, sourceFile),
				});
			}
		}

		function isFunctionConstructor(
			node: AST.CallExpression | AST.NewExpression,
			checker: Checker,
			program: Program,
		) {
			if (node.expression.kind === SyntaxKind.Identifier) {
				if (
					isGlobalDeclarationOfName(
						node.expression,
						"Function",
						checker,
						program,
					)
				) {
					return true;
				}
			} else if (
				node.expression.kind === SyntaxKind.PropertyAccessExpression &&
				isGlobalDeclaration(node.expression, checker, program)
			) {
				const propertyName = node.expression.name.text;
				if (propertyName !== "Function") {
					return false;
				}

				const object = node.expression.expression;
				if (object.kind === SyntaxKind.Identifier) {
					return object.text === "globalThis" || object.text === "window";
				}
			}

			return false;
		}

		return {
			visitors: {
				CallExpression: checkNode,
				NewExpression: checkNode,
			},
		};
	},
});
