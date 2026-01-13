import { type AST, getTSNodeRange, typescriptLanguage } from "@flint.fyi/ts";
import { nullThrows } from "@flint.fyi/utils";
import { SyntaxKind } from "typescript";

function isFileURLToPathCall(node: AST.Expression): node is AST.CallExpression {
	return (
		node.kind === SyntaxKind.CallExpression &&
		node.expression.kind === SyntaxKind.Identifier &&
		node.expression.text === "fileURLToPath" &&
		node.arguments.length === 1
	);
}

function isImportMetaFilename(
	node: AST.Expression,
): node is AST.PropertyAccessExpression {
	return (
		node.kind === SyntaxKind.PropertyAccessExpression &&
		node.expression.kind === SyntaxKind.MetaProperty &&
		node.expression.keywordToken === SyntaxKind.ImportKeyword &&
		node.expression.name.text === "meta" &&
		node.name.kind === SyntaxKind.Identifier &&
		node.name.text === "filename"
	);
}

function isImportMetaUrl(
	node: AST.Expression,
): node is AST.PropertyAccessExpression {
	return (
		node.kind === SyntaxKind.PropertyAccessExpression &&
		node.expression.kind === SyntaxKind.MetaProperty &&
		node.expression.keywordToken === SyntaxKind.ImportKeyword &&
		node.expression.name.text === "meta" &&
		node.name.kind === SyntaxKind.Identifier &&
		node.name.text === "url"
	);
}

function isNewURLWithDot(node: AST.Expression): node is AST.NewExpression & {
	arguments: NonNullable<AST.NewExpression["arguments"]>;
} {
	if (
		node.kind !== SyntaxKind.NewExpression ||
		node.expression.kind !== SyntaxKind.Identifier ||
		node.expression.text !== "URL" ||
		node.arguments?.length !== 2
	) {
		return false;
	}

	const firstArgument = nullThrows(
		node.arguments[0],
		"First argument is expected to be present by prior length check",
	);
	return (
		firstArgument.kind == SyntaxKind.StringLiteral && firstArgument.text === "."
	);
}

function isPathDirnameCall(node: AST.CallExpression): boolean {
	return (
		node.expression.kind === SyntaxKind.PropertyAccessExpression &&
		node.expression.expression.kind === SyntaxKind.Identifier &&
		node.expression.expression.text === "path" &&
		node.expression.name.kind === SyntaxKind.Identifier &&
		node.expression.name.text === "dirname" &&
		node.arguments.length === 1
	);
}

export default typescriptLanguage.createRule({
	about: {
		description:
			"Prefer `import.meta.dirname` and `import.meta.filename` over legacy file path techniques.",
		id: "filePathsFromImportMeta",
		preset: "stylistic",
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
								node.parent.kind === SyntaxKind.CallExpression &&
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
