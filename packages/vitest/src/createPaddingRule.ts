import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator, type VitestRuleAbout } from "./ruleCreator.ts";
import { getNodeSiblings } from "./utils/getNodeSiblings.ts";
import {
	nodeIsVitestBlock,
	type VitestBlock,
} from "./utils/nodeIsVitestBlock.ts";

export function createPaddingRule(about: VitestRuleAbout, targetName: string) {
	return ruleCreator.createRule(typescriptLanguage, {
		about,
		messages: {
			missingPadding: {
				primary:
					"This statement should be separated from a neighboring `{{ blockName }}` block by a blank line.",
				secondary: [
					"Blank lines make `{{ blockName }}` blocks easier to scan alongside surrounding test statements.",
					"This rule does not require an extra blank line after a `{{ blockName }}` block when it is the last statement in its scope.",
				],
				suggestions: ["Insert a blank line before this statement."],
			},
		},
		setup(context) {
			function getNodeLeadingContentStart(
				node: AST.AnyNode,
				sourceFile: AST.SourceFile,
			) {
				const leadingComments = ts.getLeadingCommentRanges(
					sourceFile.text,
					node.getFullStart(),
				);

				return leadingComments?.[0]?.pos ?? node.getStart(sourceFile);
			}

			function getNodeReportRange(
				node: AST.AnyNode,
				sourceFile: AST.SourceFile,
			) {
				const firstToken = node.getFirstToken(sourceFile);

				return firstToken
					? {
							begin: firstToken.getStart(sourceFile),
							end: firstToken.getEnd(),
						}
					: getTSNodeRange(node, sourceFile);
			}

			function getNodeTrailingContentEnd(
				node: AST.AnyNode,
				sourceFile: AST.SourceFile,
			) {
				const trailingComments = ts.getTrailingCommentRanges(
					sourceFile.text,
					node.getEnd(),
				);
				const lastTrailingComment = trailingComments?.at(-1);
				if (!lastTrailingComment) {
					return node.getEnd();
				}

				const nodeEndLine = sourceFile.getLineAndCharacterOfPosition(
					node.getEnd(),
				).line;
				const trailingCommentLine = sourceFile.getLineAndCharacterOfPosition(
					lastTrailingComment.pos,
				).line;
				if (trailingCommentLine !== nodeEndLine) {
					return node.getEnd();
				}

				return lastTrailingComment.end;
			}

			function getPaddingFix(
				previous: AST.AnyNode,
				next: AST.AnyNode,
				sourceFile: AST.SourceFile,
			) {
				const previousEnd = getNodeTrailingContentEnd(previous, sourceFile);
				const nextStart = getNodeLeadingContentStart(next, sourceFile);
				const previousLine =
					sourceFile.getLineAndCharacterOfPosition(previousEnd).line;
				const nextLine =
					sourceFile.getLineAndCharacterOfPosition(nextStart).line;

				if (nextLine - previousLine > 1) {
					return undefined;
				}

				return {
					range: {
						begin: previousEnd,
						end: previousEnd,
					},
					text: previousLine === nextLine ? "\n\n" : "\n",
				};
			}

			function nodeIsTargetBlock(node: AST.AnyNode) {
				return (
					node.kind === ts.SyntaxKind.ExpressionStatement &&
					node.expression.kind === ts.SyntaxKind.CallExpression &&
					nodeIsVitestBlock(node.expression) &&
					node.expression.expression.kind === ts.SyntaxKind.Identifier &&
					node.expression.expression.text === targetName
				);
			}

			function reportIfFixable(
				first: AST.AnyNode,
				second: AST.AnyNode,
				sourceFile: AST.SourceFile,
			) {
				const fix = getPaddingFix(first, second, sourceFile);
				if (!fix) {
					return;
				}

				context.report({
					data: {
						blockName: targetName,
					},
					fix: [fix],
					message: "missingPadding",
					range: getNodeReportRange(second, sourceFile),
				});
			}

			function checkNode(node: VitestBlock, sourceFile: AST.SourceFile) {
				if (node.parent.kind !== ts.SyntaxKind.ExpressionStatement) {
					return;
				}

				const { next, previous } = getNodeSiblings(node.parent);

				if (
					next &&
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore -- https://github.com/flint-fyi/flint/issues/2711
					next.kind !== ts.SyntaxKind.EndOfFileToken &&
					!nodeIsTargetBlock(next)
				) {
					reportIfFixable(node.parent, next, sourceFile);
				}

				if (previous) {
					reportIfFixable(previous, node.parent, sourceFile);
				}
			}

			return {
				visitors: {
					CallExpression: (node, { sourceFile }) => {
						if (
							nodeIsVitestBlock(node) &&
							node.expression.kind === ts.SyntaxKind.Identifier &&
							node.expression.text === targetName
						) {
							checkNode(node, sourceFile);
						}
					},
				},
			};
		},
	});
}
