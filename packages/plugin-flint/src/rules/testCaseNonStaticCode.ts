import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import { SyntaxKind } from "typescript";

import { getRuleTesterCaseArrays } from "../utils/getRuleTesterCaseArrays.ts";
import { ruleCreator } from "./ruleCreator.ts";

function getCodeProperty(node: AST.ObjectLiteralExpression) {
	return node.properties.find((property) => {
		if (property.kind === SyntaxKind.PropertyAssignment) {
			const name = property.name;
			return (
				(name.kind === SyntaxKind.Identifier ||
					name.kind === SyntaxKind.StringLiteral) &&
				name.text === "code"
			);
		}

		return (
			property.kind === SyntaxKind.ShorthandPropertyAssignment &&
			property.name.text === "code"
		);
	});
}

function isStaticString(node: AST.Expression) {
	return (
		node.kind === SyntaxKind.StringLiteral ||
		node.kind === SyntaxKind.NoSubstitutionTemplateLiteral
	);
}

function isStringRawNoSubstitution(node: AST.Expression) {
	if (node.kind !== SyntaxKind.TaggedTemplateExpression) {
		return false;
	}

	const tag = node.tag;
	return (
		tag.kind === SyntaxKind.PropertyAccessExpression &&
		tag.expression.kind === SyntaxKind.Identifier &&
		tag.expression.text === "String" &&
		tag.name.kind === SyntaxKind.Identifier &&
		tag.name.text === "raw" &&
		node.template.kind === SyntaxKind.NoSubstitutionTemplateLiteral
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Test case code should be a static string literal.",
		id: "testCaseNonStaticCode",
		presets: ["logical"],
	},
	messages: {
		nonStaticTestCaseCode: {
			primary: "Test case code should be a static string literal.",
			secondary: [
				"Avoid generating test case code with variables, function calls, or template interpolations.",
				"Static strings keep test cases easy to audit and analyze with lint rules.",
			],
			suggestions: ["Replace the test case code with a static string literal."],
		},
	},
	setup(context) {
		function checkTestCase(
			testCase: AST.Expression,
			sourceFile: AST.SourceFile,
		) {
			if (
				testCase.kind === SyntaxKind.OmittedExpression ||
				isStaticString(testCase) ||
				isStringRawNoSubstitution(testCase)
			) {
				return;
			}

			if (testCase.kind !== SyntaxKind.ObjectLiteralExpression) {
				const range = getTSNodeRange(testCase, sourceFile);
				context.report({
					message: "nonStaticTestCaseCode",
					range,
				});
				return;
			}

			const codeProperty = getCodeProperty(testCase);
			if (!codeProperty) {
				// No `code` property, but has a spread assignment ({ ...x })
				if (
					testCase.properties.some(
						(node) => node.kind === SyntaxKind.SpreadAssignment,
					)
				) {
					const range = getTSNodeRange(testCase, sourceFile);
					context.report({
						message: "nonStaticTestCaseCode",
						range,
					});
				}

				return;
			}

			// `{ code: "a" }`
			if (codeProperty.kind === SyntaxKind.PropertyAssignment) {
				if (
					isStaticString(codeProperty.initializer) ||
					isStringRawNoSubstitution(codeProperty.initializer)
				) {
					return;
				}

				const range = getTSNodeRange(codeProperty.initializer, sourceFile);
				context.report({
					message: "nonStaticTestCaseCode",
					range,
				});
				return;
			}

			// `{ code }`
			if (codeProperty.kind === SyntaxKind.ShorthandPropertyAssignment) {
				const range = getTSNodeRange(codeProperty.name, sourceFile);
				context.report({
					message: "nonStaticTestCaseCode",
					range,
				});
			}
		}

		return {
			visitors: {
				CallExpression(node, { sourceFile }) {
					const testArrays = getRuleTesterCaseArrays(node);
					if (!testArrays) {
						return;
					}

					for (const testCase of [
						...testArrays.valid.elements,
						...testArrays.invalid.elements,
					]) {
						checkTestCase(testCase, sourceFile);
					}
				},
			},
		};
	},
});
