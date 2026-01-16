import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts, { SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function hasComments(block: AST.Block, sourceFile: AST.SourceFile) {
	const fullText = sourceFile.getFullText();
	const openBrace = block.getStart(sourceFile);
	const closeBrace = block.getEnd();
	const innerText = fullText.substring(openBrace + 1, closeBrace - 1);

	return /\S+/.test(innerText.trim());
}

function isEmptyBlock(block: AST.Block, sourceFile: AST.SourceFile) {
	return block.statements.length === 0 && !hasComments(block, sourceFile);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports empty functions that should contain code or a comment.",
		id: "emptyFunctions",
		presets: ["stylistic", "stylisticStrict"],
	},
	messages: {
		emptyFunction: {
			primary:
				"Empty functions should contain code or a comment explaining why they are empty.",
			secondary: [
				"Empty functions can reduce readability because readers need to guess whether it's intentional or not.",
				"Adding a comment makes the intention clear.",
			],
			suggestions: [
				"Add a comment explaining why the function is intentionally empty.",
				"Add to the function body.",
			],
		},
	},
	setup(context) {
		function checkFunctionBody(
			node: ts.Node,
			body: AST.Block | undefined,
			sourceFile: AST.SourceFile,
		) {
			if (body && isEmptyBlock(body, sourceFile)) {
				context.report({
					message: "emptyFunction",
					range: getTSNodeRange(node, sourceFile),
				});
			}
		}

		return {
			visitors: {
				ArrowFunction: (node, { sourceFile }) => {
					if (node.body.kind === SyntaxKind.Block) {
						checkFunctionBody(node, node.body, sourceFile);
					}
				},
				Constructor: (node, { sourceFile }) => {
					checkFunctionBody(node, node.body, sourceFile);
				},
				FunctionDeclaration: (node, { sourceFile }) => {
					checkFunctionBody(node, node.body, sourceFile);
				},
				FunctionExpression: (node, { sourceFile }) => {
					checkFunctionBody(node, node.body, sourceFile);
				},
				GetAccessor: (node, { sourceFile }) => {
					checkFunctionBody(node, node.body, sourceFile);
				},
				MethodDeclaration: (node, { sourceFile }) => {
					checkFunctionBody(node, node.body, sourceFile);
				},
				SetAccessor: (node, { sourceFile }) => {
					checkFunctionBody(node, node.body, sourceFile);
				},
			},
		};
	},
});
