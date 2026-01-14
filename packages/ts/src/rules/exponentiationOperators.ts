import { SyntaxKind } from "typescript";
import ts from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import type { Checker } from "../index.ts";
import { typescriptLanguage } from "../language.ts";
import type * as AST from "../types/ast.ts";
import { isGlobalDeclarationOfName } from "../utils/isGlobalDeclarationOfName.ts";
import { ruleCreator } from "./ruleCreator.ts";

function isMathPowCall(
	node: AST.CallExpression,
	typeChecker: Checker,
): boolean {
	const callee = node.expression;

	if (!ts.isPropertyAccessExpression(callee)) {
		return false;
	}

	if (callee.name.text !== "pow") {
		return false;
	}

	if (callee.expression.kind !== SyntaxKind.Identifier) {
		return false;
	}

	const mathObject = callee.expression as AST.Identifier;
	if (mathObject.text !== "Math") {
		return false;
	}

	if (!isGlobalDeclarationOfName(mathObject, "Math", typeChecker)) {
		return false;
	}

	return node.arguments.length === 2;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Prefers the ** operator over Math.pow().",
		id: "exponentiationOperators",
		presets: ["stylistic"],
	},
	messages: {
		preferOperator: {
			primary: "Use the ** operator instead of Math.pow() for exponentiation.",
			secondary: [
				"The ** operator was introduced in ES2016 and is more readable.",
				"It also works with BigInt values, unlike Math.pow().",
			],
			suggestions: ["Replace Math.pow(base, exponent) with base ** exponent."],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression: (node, { sourceFile, typeChecker }) => {
					if (isMathPowCall(node, typeChecker)) {
						context.report({
							message: "preferOperator",
							range: getTSNodeRange(node, sourceFile),
						});
					}
				},
			},
		};
	},
});
