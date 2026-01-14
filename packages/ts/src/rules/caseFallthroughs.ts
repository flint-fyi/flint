import * as ts from "typescript";

import type { AST } from "../index.ts";
import { typescriptLanguage } from "../language.ts";

const fallthroughCommentPattern = /falls?\s*through/i;

function endsWithTerminatingStatement(statements: ts.NodeArray<AST.Statement>) {
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	return !!statements.length && isTerminatingStatement(statements.at(-1)!);
}

function hasFallthroughComment(
	clause: AST.CaseClause | AST.DefaultClause,
	nextClause: AST.CaseClause | AST.DefaultClause,
	sourceFile: ts.SourceFile,
): boolean {
	const sourceText = sourceFile.getFullText();
	const commentRanges = ts.getLeadingCommentRanges(
		sourceText,
		nextClause.getFullStart(),
	);

	if (commentRanges) {
		for (const range of commentRanges) {
			const comment = sourceText.slice(range.pos, range.end);
			if (fallthroughCommentPattern.test(comment)) {
				return true;
			}
		}
	}

	const trailingRanges = ts.getTrailingCommentRanges(
		sourceText,
		clause.getEnd(),
	);
	if (trailingRanges) {
		for (const range of trailingRanges) {
			const comment = sourceText.slice(range.pos, range.end);
			if (fallthroughCommentPattern.test(comment)) {
				return true;
			}
		}
	}

	return false;
}

function isTerminatingStatement(node: AST.Statement): boolean {
	switch (node.kind) {
		case ts.SyntaxKind.Block:
			return endsWithTerminatingStatement(node.statements);

		case ts.SyntaxKind.BreakStatement:
		case ts.SyntaxKind.ContinueStatement:
		case ts.SyntaxKind.ReturnStatement:
		case ts.SyntaxKind.ThrowStatement:
			return true;

		case ts.SyntaxKind.IfStatement:
			return (
				!!node.elseStatement &&
				isTerminatingStatement(node.thenStatement) &&
				isTerminatingStatement(node.elseStatement)
			);

		case ts.SyntaxKind.SwitchStatement: {
			return (
				node.caseBlock.clauses.some(ts.isDefaultClause) &&
				node.caseBlock.clauses.every(
					(clause) =>
						clause.statements.length === 0 ||
						endsWithTerminatingStatement(clause.statements),
				)
			);
		}

		case ts.SyntaxKind.TryStatement: {
			if (node.finallyBlock) {
				return endsWithTerminatingStatement(node.finallyBlock.statements);
			}

			if (!node.catchClause) {
				return endsWithTerminatingStatement(node.tryBlock.statements);
			}

			return (
				endsWithTerminatingStatement(node.tryBlock.statements) &&
				endsWithTerminatingStatement(node.catchClause.block.statements)
			);
		}

		default:
			return false;
	}
}

export default typescriptLanguage.createRule({
	about: {
		description: "Reports switch case clauses that fall through unexpectedly.",
		id: "caseFallthroughs",
		presets: ["logical"],
	},
	messages: {
		unexpectedFallthrough: {
			primary:
				"This case falls through to the next case without a break, return, or throw statement.",
			secondary: [
				"Fallthrough in switch statements is often unintentional and can lead to bugs.",
				"If fallthrough is intentional, add a comment containing 'falls through' to indicate this.",
			],
			suggestions: [
				"Add a `break` statement at the end of this case.",
				"Add a `return` or `throw` statement if appropriate.",
				"If fallthrough is intentional, add a `// falls through` comment.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				SwitchStatement: (node, { sourceFile }) => {
					for (let i = 0; i < node.caseBlock.clauses.length - 1; i++) {
						const clause = node.caseBlock.clauses[i];
						if (!clause) {
							continue;
						}

						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						const nextClause = node.caseBlock.clauses[i + 1]!;

						if (
							clause.statements.length === 0 ||
							endsWithTerminatingStatement(clause.statements) ||
							hasFallthroughComment(clause, nextClause, sourceFile)
						) {
							continue;
						}

						const caseKeyword = ts.isCaseClause(clause) ? "case" : "default";

						context.report({
							message: "unexpectedFallthrough",
							range: {
								begin: clause.getStart(sourceFile),
								end: clause.getStart(sourceFile) + caseKeyword.length,
							},
						});
					}
				},
			},
		};
	},
});
