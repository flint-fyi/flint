import ts from "typescript";
import { z } from "zod";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";
import { ruleCreator } from "./ruleCreator.ts";

const policySchema = z
	.enum(["always", "asNeeded", "never"])
	.default("always")
	.describe(
		"'always' requires names, 'asNeeded' only when not auto-inferred, 'never' disallows names.",
	);

function hasInferredName(node: ts.FunctionExpression): boolean {
	const { parent } = node;

	if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) {
		return true;
	}

	if (ts.isPropertyAssignment(parent) && ts.isIdentifier(parent.name)) {
		return true;
	}

	if (ts.isPropertyDeclaration(parent) && ts.isIdentifier(parent.name)) {
		return true;
	}

	if (
		ts.isBinaryExpression(parent) &&
		parent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
		ts.isIdentifier(parent.left)
	) {
		return true;
	}

	return false;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports function expressions without names.",
		id: "functionNames",
		presets: ["stylistic"],
	},
	messages: {
		missingName: {
			primary: "Function expression should have a name.",
			secondary: [
				"Named function expressions produce better stack traces for debugging.",
				"The function name appears in error messages and developer tools.",
			],
			suggestions: ["Give the function a name."],
		},
		unexpectedName: {
			primary: "Function expression should not have a name.",
			secondary: [
				"Anonymous function expressions are preferred for consistency.",
			],
			suggestions: ["Remove the function name."],
		},
	},
	options: {
		policy: policySchema,
	},
	setup(context) {
		return {
			visitors: {
				FunctionExpression: (node, { options, sourceFile }) => {
					const hasName = !!node.name;

					if (options.policy === "never") {
						if (hasName) {
							context.report({
								message: "unexpectedName",
								range: getTSNodeRange(node.name, sourceFile),
							});
						}
						return;
					}

					if (options.policy === "always") {
						if (!hasName) {
							const functionKeyword = node
								.getChildren(sourceFile)
								.find((child) => child.kind === ts.SyntaxKind.FunctionKeyword);
							context.report({
								message: "missingName",
								range: getTSNodeRange(functionKeyword ?? node, sourceFile),
							});
						}
						return;
					}

					if (!hasName && !hasInferredName(node)) {
						const functionKeyword = node
							.getChildren(sourceFile)
							.find((child) => child.kind === ts.SyntaxKind.FunctionKeyword);
						context.report({
							message: "missingName",
							range: getTSNodeRange(functionKeyword ?? node, sourceFile),
						});
					}
				},
			},
		};
	},
});
