import {
	isCallExpression,
	isIdentifier,
	isMetaProperty,
	isNewExpression,
	isPropertyAccessExpression,
	isStringLiteral,
	SyntaxKind,
} from "typescript-native/unstable/ast";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
} from "@flint.fyi/typescript-language";
import { nullThrows } from "@flint.fyi/utils";

import { ruleCreator } from "./ruleCreator.ts";

function isFileURLToPathCall(node: AST.Expression): node is AST.CallExpression {
	return (
		isCallExpression(node) &&
		isIdentifier(node.expression) &&
		node.expression.text === "fileURLToPath" &&
		node.arguments.length === 1
	);
}

function isImportMetaFilename(
	node: AST.Expression,
): node is AST.PropertyAccessExpression {
	return (
		isPropertyAccessExpression(node) &&
		isMetaProperty(node.expression) &&
		node.expression.keywordToken === SyntaxKind.ImportKeyword &&
		node.expression.name.text === "meta" &&
		isIdentifier(node.name) &&
		node.name.text === "filename"
	);
}

function isImportMetaUrl(
	node: AST.Expression,
): node is AST.PropertyAccessExpression {
	return (
		isPropertyAccessExpression(node) &&
		isMetaProperty(node.expression) &&
		node.expression.keywordToken === SyntaxKind.ImportKeyword &&
		node.expression.name.text === "meta" &&
		isIdentifier(node.name) &&
		node.name.text === "url"
	);
}

function isNewURLWithDot(node: AST.Expression): node is AST.NewExpression & {
	arguments: NonNullable<AST.NewExpression["arguments"]>;
} {
	if (
		!isNewExpression(node) ||
		!isIdentifier(node.expression) ||
		node.expression.text !== "URL" ||
		node.arguments?.length !== 2
	) {
		return false;
	}

	const firstArgument = nullThrows(
		node.arguments[0],
		"First argument is expected to be present by prior length check",
	);
	return isStringLiteral(firstArgument) && firstArgument.text === ".";
}

function isPathDirnameCall(node: AST.CallExpression): boolean {
	return (
		isPropertyAccessExpression(node.expression) &&
		isIdentifier(node.expression.expression) &&
		node.expression.expression.text === "path" &&
		isIdentifier(node.expression.name) &&
		node.expression.name.text === "dirname" &&
		node.arguments.length === 1
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Prefer `import.meta.dirname` and `import.meta.filename` over legacy file path techniques.",
		id: "filePathsFromImportMeta",
		presets: ["stylistic", "stylisticStrict"],
	},
	messages: {
		preferImportMetaDirname: {
			primary:
				"Prefer `import.meta.dirname` over legacy directory path techniques.",
			secondary: [
				"Node.js 20.11 introduced `import.meta.dirname` as a direct equivalent to `path.dirname(fileURLToPath(import.meta.url))`.",
				"Using `import.meta.dirname` is more concise and doesn't require importing from `node:path` or `node:url`.",
			],
			suggestions: ["Replace with `import.meta.dirname`"],
		},
		preferImportMetaFilename: {
			primary:
				"Prefer `import.meta.filename` over `fileURLToPath(import.meta.url)`.",
			secondary: [
				"Node.js 20.11 introduced `import.meta.filename` as a direct equivalent to `fileURLToPath(import.meta.url)`.",
				"Using `import.meta.filename` is more concise and doesn't require importing from `node:url`.",
			],
			suggestions: ["Replace with `import.meta.filename`"],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression: (node, { sourceFile }) => {
					// Check for path.dirname(fileURLToPath(import.meta.url))
					// Check for path.dirname(import.meta.filename)
					// These must be checked first to avoid double-reporting
					if (isPathDirnameCall(node)) {
						const firstArg = nullThrows(
							node.arguments[0],
							"path.dirname should have one argument",
						);
						if (
							isFileURLToPathCall(firstArg) &&
							isImportMetaUrl(
								nullThrows(
									firstArg.arguments[0],
									"fileURLToPath should have one argument",
								),
							)
						) {
							context.report({
								message: "preferImportMetaDirname",
								range: getTSNodeRange(node, sourceFile),
							});
							return;
						}

						if (isImportMetaFilename(firstArg)) {
							context.report({
								message: "preferImportMetaDirname",
								range: getTSNodeRange(node, sourceFile),
							});
							return;
						}
					}

					// Check for fileURLToPath(new URL('.', import.meta.url))
					// Check for fileURLToPath(import.meta.url)
					// This must be checked last to avoid double-reporting when inside path.dirname()
					if (isFileURLToPathCall(node)) {
						const firstArg = nullThrows(
							node.arguments[0],
							"fileURLToPath should have one argument",
						);
						if (
							isNewURLWithDot(firstArg) &&
							isImportMetaUrl(
								nullThrows(
									firstArg.arguments[1],
									"new URL should have second argument",
								),
							)
						) {
							context.report({
								message: "preferImportMetaDirname",
								range: getTSNodeRange(node, sourceFile),
							});
							return;
						}

						if (isImportMetaUrl(firstArg)) {
							// Don't report if this is inside a path.dirname call
							if (
								isCallExpression(node.parent) &&
								isPathDirnameCall(node.parent) &&
								node.parent.arguments[0] === node
							) {
								return;
							}

							context.report({
								message: "preferImportMetaFilename",
								range: getTSNodeRange(node, sourceFile),
							});
							return;
						}
					}
				},
			},
		};
	},
});
