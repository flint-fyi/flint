import * as tsutils from "ts-api-utils";
import { SyntaxKind } from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";
import { isGlobalVariable } from "../utils/isGlobalVariable.ts";

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports attempting to assign to read-only global variables such as undefined, NaN, Infinity, Object, etc.",
		id: "globalAssignments",
		preset: "untyped",
	},
	messages: {
		noGlobalAssign: {
			primary:
				"Read-only global variables should not be reassigned or modified.",
			secondary: [
				"Global variables like undefined, NaN, Infinity, and built-in objects like Object and Array are read-only and should not be modified.",
				"Attempting to reassign these globals can lead to confusing behavior and potential bugs in your code.",
				"In strict mode, reassigning these globals will throw a TypeError at runtime.",
			],
			suggestions: [
				"Use a different variable name instead of shadowing or reassigning globals.",
				"If you need a similar name, consider using a more specific name that doesn't conflict with global variables.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				BinaryExpression: (node, { sourceFile, typeChecker }) => {
					if (
						tsutils.isAssignmentKind(node.operatorToken.kind) &&
						isGlobalVariable(node.left, typeChecker)
					) {
						context.report({
							message: "noGlobalAssign",
							range: getTSNodeRange(node.left, sourceFile),
						});
					}
				},
				PostfixUnaryExpression: (node, { sourceFile, typeChecker }) => {
					if (isGlobalVariable(node.operand, typeChecker)) {
						context.report({
							message: "noGlobalAssign",
							range: getTSNodeRange(node.operand, sourceFile),
						});
					}
				},
				PrefixUnaryExpression: (node, { sourceFile, typeChecker }) => {
					if (
						(node.operator === SyntaxKind.PlusPlusToken ||
							node.operator === SyntaxKind.MinusMinusToken) &&
						isGlobalVariable(node.operand, typeChecker)
					) {
						context.report({
							message: "noGlobalAssign",
							range: getTSNodeRange(node.operand, sourceFile),
						});
					}
				},
			},
		};
	},
});
