import {
	isIdentifier,
	isPropertyAccessExpression,
} from "typescript-native/unstable/ast";

import {
	getStaticStringValue,
	getTSNodeRange,
	isGlobalDeclaration,
	typescriptLanguage,
	type AST,
} from "@flint.fyi/typescript-language";
import { nullThrows } from "@flint.fyi/utils";

import { ruleCreator } from "./ruleCreator.ts";
import { isASTExpression } from "./typeGuards.ts";

type AttributeMethodName =
	| "getAttribute"
	| "hasAttribute"
	| "removeAttribute"
	| "setAttribute";

function convertDataAttributeToDatasetKey(
	attributeName: string,
): string | undefined {
	return attributeName.startsWith("data-")
		? attributeName
				.slice(5)
				.replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase())
		: undefined;
}

function getMethodDetails(node: AST.CallExpression) {
	if (
		!node.arguments.length ||
		!isPropertyAccessExpression(node.expression) ||
		!isIdentifier(node.expression.name)
	) {
		return undefined;
	}

	const methodName = node.expression.name.text;
	if (!isAttributeMethodName(methodName)) {
		return undefined;
	}

	return {
		methodName,
		methodNode: node.expression.name,
	};
}

const attributeMethodNames = new Set([
	"getAttribute",
	"hasAttribute",
	"removeAttribute",
	"setAttribute",
]);

function isAttributeMethodName(
	methodName: string,
): methodName is AttributeMethodName {
	return attributeMethodNames.has(methodName);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Prefer using element.dataset over getAttribute/setAttribute for data-* attributes.",
		id: "nodeDatasetAttributes",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		preferDataset: {
			primary:
				"Prefer using `.dataset` as a safer, more idiomatic API for accessing data-* attributes.",
			secondary: [
				"The `dataset` property automatically handles the conversion between kebab-case attribute names and camelCase property names.",
				"It is generally considered preferable and less danger-prone than legacy methods for data-* attribute manipulation.",
			],
			suggestions: ["Use the `dataset` property instead."],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression(node, { program, sourceFile, typeChecker }) {
					const details = getMethodDetails(node);
					if (!details) {
						return;
					}

					const firstArgument = nullThrows(
						node.arguments[0],
						"First argument is expected to be present by prior length check",
					);
					if (!isASTExpression(firstArgument)) {
						return;
					}

					const attributeName = getStaticStringValue(firstArgument);
					if (!attributeName) {
						return;
					}

					const datasetKey = convertDataAttributeToDatasetKey(attributeName);
					if (!datasetKey) {
						return;
					}

					if (
						!isASTExpression(node.expression) ||
						!isGlobalDeclaration(node.expression, typeChecker, program)
					) {
						return;
					}

					context.report({
						message: "preferDataset",
						range: getTSNodeRange(details.methodNode, sourceFile),
						// TODO: add an automated changer
					});
				},
			},
		};
	},
});
