import { SyntaxKind } from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import type { Checker } from "../index.ts";
import { typescriptLanguage } from "../language.ts";
import type * as AST from "../types/ast.ts";
import { isGlobalDeclarationOfName } from "../utils/isGlobalDeclarationOfName.ts";
import { ruleCreator } from "./ruleCreator.ts";

function isEvalCall(node: AST.CallExpression, typeChecker: Checker): boolean {
	const callee = node.expression;

	if (callee.kind !== SyntaxKind.Identifier) {
		return false;
	}

	if (callee.text !== "eval") {
		return false;
	}

	return isGlobalDeclarationOfName(callee, "eval", typeChecker);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports uses of the eval function.",
		id: "evals",
		presets: ["logical"],
	},
	messages: {
		noEval: {
			primary: "Avoid using eval() as it poses security and performance risks.",
			secondary: [
				"eval() executes arbitrary code, which can be exploited for code injection attacks.",
				"It prevents JavaScript engine optimizations, making code run slower.",
				"It makes code harder to debug and reason about.",
			],
			suggestions: [
				"Use safer alternatives like JSON.parse() for parsing JSON data.",
				"Use Function constructor if dynamic code execution is truly necessary (though still risky).",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression: (node, { sourceFile, typeChecker }) => {
					if (isEvalCall(node, typeChecker)) {
						context.report({
							message: "noEval",
							range: getTSNodeRange(node.expression, sourceFile),
						});
					}
				},
			},
		};
	},
});
