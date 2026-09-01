import {
	isIdentifier,
	isNoSubstitutionTemplateLiteral,
	isObjectLiteralExpression,
	isOmittedExpression,
	isPropertyAccessExpression,
	isPropertyAssignment,
	isShorthandPropertyAssignment,
	isSpreadAssignment,
	isStringLiteral,
	isTaggedTemplateExpression,
} from "typescript-native/unstable/ast";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
} from "@flint.fyi/typescript-language";

import { getRuleTesterCaseArrays } from "../utils/getRuleTesterCaseArrays.ts";
import { ruleCreator } from "./ruleCreator.ts";

function getCodeProperty(node: AST.ObjectLiteralExpression) {
	return node.properties.find((property) => {
		if (isPropertyAssignment(property)) {
			const name = property.name;
			return (
				(isIdentifier(name) || isStringLiteral(name)) && name.text === "code"
			);
		}

		return (
			isShorthandPropertyAssignment(property) &&
			isIdentifier(property.name) &&
			property.name.text === "code"
		);
	});
}

function isStaticString(node: AST.Expression) {
	return isStringLiteral(node) || isNoSubstitutionTemplateLiteral(node);
}

function isStringRawNoSubstitution(node: AST.Expression) {
	if (!isTaggedTemplateExpression(node)) {
		return false;
	}

	const tag = node.tag;
	return (
		isPropertyAccessExpression(tag) &&
		isIdentifier(tag.expression) &&
		tag.expression.text === "String" &&
		isIdentifier(tag.name) &&
		tag.name.text === "raw" &&
		isNoSubstitutionTemplateLiteral(node.template)
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
				isOmittedExpression(testCase) ||
				isStaticString(testCase) ||
				isStringRawNoSubstitution(testCase)
			) {
				return;
			}

			if (!isObjectLiteralExpression(testCase)) {
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
				if (testCase.properties.some((node) => isSpreadAssignment(node))) {
					const range = getTSNodeRange(testCase, sourceFile);
					context.report({
						message: "nonStaticTestCaseCode",
						range,
					});
				}

				return;
			}

			// `{ code: "a" }`
			if (isPropertyAssignment(codeProperty)) {
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
			if (isShorthandPropertyAssignment(codeProperty)) {
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
