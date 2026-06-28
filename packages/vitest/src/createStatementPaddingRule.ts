import ts from "typescript";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

import { ruleCreator, type VitestRuleAbout } from "./ruleCreator.ts";

export interface StatementPaddingMatch {
	blockName: string;
	category: string;
}

export function createStatementPaddingRule(
	about: VitestRuleAbout,
	getStatementMatch: (
		statement: AST.AnyNode,
	) => StatementPaddingMatch | undefined,
	shouldRequirePadding: (
		previousMatch: StatementPaddingMatch | undefined,
		nextMatch: StatementPaddingMatch | undefined,
	) => boolean,
) {
	return ruleCreator.createRule(typescriptLanguage, {
		about,
		messages: {
			missingPadding: {
				primary:
					"This statement should be separated from a neighboring `{{ blockName }}` block by a blank line.",
				secondary: [
					"Blank lines make `{{ blockName }}` blocks easier to scan alongside surrounding test statements.",
					"Except for a `{{ blockName }}` that's the last statement in its scope, prefer adding a blank line for visual padding.",
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

			function checkStatements(
				{
					statements,
				}: AST.Block | AST.CaseClause | AST.DefaultClause | AST.SourceFile,
				{ sourceFile }: TypeScriptFileServices,
			) {
				for (let index = 1; index < statements.length; index += 1) {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const previous = statements[index - 1]!;
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const next = statements[index]!;
					const previousMatch = getStatementMatch(previous);
					const nextMatch = getStatementMatch(next);

					if (!shouldRequirePadding(previousMatch, nextMatch)) {
						continue;
					}

					const fix = getPaddingFix(previous, next, sourceFile);
					if (!fix) {
						continue;
					}

					context.report({
						data: {
							blockName:
								nextMatch?.blockName ?? previousMatch?.blockName ?? "vitest",
						},
						fix: [fix],
						message: "missingPadding",
						range: getNodeReportRange(next, sourceFile),
					});
				}
			}

			return {
				visitors: {
					Block: checkStatements,
					CaseClause: checkStatements,
					DefaultClause: checkStatements,
					SourceFile: checkStatements,
				},
			};
		},
	});
}

export function getStatementRootName(statement: AST.AnyNode) {
	const expression = getStatementExpression(statement);
	if (!expression) {
		return undefined;
	}

	if (expression.kind === ts.SyntaxKind.AwaitExpression) {
		return getRootIdentifierName(expression.expression);
	}

	return getRootIdentifierName(expression);
}

function getRootIdentifierName(node: AST.AnyNode): string | undefined {
	if (node.kind === ts.SyntaxKind.Identifier) {
		return node.text;
	}

	if (
		node.kind === ts.SyntaxKind.CallExpression ||
		node.kind === ts.SyntaxKind.NonNullExpression ||
		node.kind === ts.SyntaxKind.ParenthesizedExpression ||
		node.kind === ts.SyntaxKind.PropertyAccessExpression
	) {
		return getRootIdentifierName(node.expression);
	}

	return undefined;
}

function getStatementExpression(
	statement: AST.AnyNode,
): AST.AnyNode | undefined {
	if (statement.kind === ts.SyntaxKind.ExpressionStatement) {
		return statement.expression;
	}

	if (statement.kind === ts.SyntaxKind.LabeledStatement) {
		return getStatementExpression(statement.statement);
	}

	return undefined;
}
