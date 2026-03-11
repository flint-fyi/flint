import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { getRuleTesterCaseArrays } from "../utils/getRuleTesterCaseArrays.ts";
import { ruleCreator } from "./ruleCreator.ts";

function getCodeProperty(node: AST.ObjectLiteralExpression) {
	return node.properties.find((property) => {
		if (ts.isPropertyAssignment(property)) {
			const name = property.name;
			return (
				(ts.isIdentifier(name) || ts.isStringLiteral(name)) &&
				name.text === "code"
			);
		}

		return (
			ts.isShorthandPropertyAssignment(property) &&
			property.name.text === "code"
		);
	});
}

function isStaticString(node: AST.Expression) {
	return ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node);
}

function isStringRawNoSubstitution(node: AST.Expression) {
	if (!ts.isTaggedTemplateExpression(node)) {
		return false;
	}

	const tag = node.tag;
	return (
		ts.isPropertyAccessExpression(tag) &&
		ts.isIdentifier(tag.expression) &&
		tag.expression.text === "String" &&
		tag.name.text === "raw" &&
		ts.isNoSubstitutionTemplateLiteral(node.template)
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
				ts.isOmittedExpression(testCase) ||
				isStaticString(testCase) ||
				isStringRawNoSubstitution(testCase)
			) {
				return;
			}

			if (!ts.isObjectLiteralExpression(testCase)) {
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
				if (testCase.properties.some(ts.isSpreadAssignment)) {
					const range = getTSNodeRange(testCase, sourceFile);
					context.report({
						message: "nonStaticTestCaseCode",
						range,
					});
				}

				return;
			}

			// `{ code: "a" }`
			if (ts.isPropertyAssignment(codeProperty)) {
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
			if (ts.isShorthandPropertyAssignment(codeProperty)) {
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
