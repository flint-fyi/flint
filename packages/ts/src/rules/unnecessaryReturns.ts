import { SyntaxKind } from "typescript";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

type FunctionBoundary =
	| AST.ArrowFunction
	| AST.ConstructorDeclaration
	| AST.FunctionDeclaration
	| AST.FunctionExpression
	| AST.GetAccessorDeclaration
	| AST.MethodDeclaration
	| AST.SetAccessorDeclaration;

function canCompleteNormally(statement: AST.Statement): boolean {
	switch (statement.kind) {
		case SyntaxKind.Block:
			return canStatementsCompleteNormally(statement.statements);

		case SyntaxKind.BreakStatement:
		case SyntaxKind.ContinueStatement:
		case SyntaxKind.ReturnStatement:
		case SyntaxKind.ThrowStatement:
			return false;

		case SyntaxKind.DoStatement:
		case SyntaxKind.WhileStatement:
			return (
				statement.expression.kind !== SyntaxKind.TrueKeyword ||
				hasBreakTargeting(statement.statement, statement)
			);

		case SyntaxKind.ForStatement:
			return (
				statement.condition !== undefined ||
				hasBreakTargeting(statement.statement, statement)
			);

		case SyntaxKind.IfStatement:
			return (
				statement.elseStatement === undefined ||
				canCompleteNormally(statement.thenStatement) ||
				canCompleteNormally(statement.elseStatement)
			);

		case SyntaxKind.LabeledStatement:
			return (
				canCompleteNormally(statement.statement) ||
				hasBreakTargeting(statement.statement, statement)
			);

		case SyntaxKind.SwitchStatement:
			return canSwitchCompleteNormally(statement);

		case SyntaxKind.TryStatement: {
			if (
				statement.finallyBlock &&
				!canCompleteNormally(statement.finallyBlock)
			) {
				return false;
			}

			return (
				canCompleteNormally(statement.tryBlock) ||
				(statement.catchClause !== undefined &&
					canCompleteNormally(statement.catchClause.block))
			);
		}

		default:
			return true;
	}
}

function canFix(node: AST.ReturnStatement, sourceFile: AST.SourceFile) {
	if (
		node.parent.kind !== SyntaxKind.Block &&
		node.parent.kind !== SyntaxKind.CaseClause &&
		node.parent.kind !== SyntaxKind.DefaultClause
	) {
		return false;
	}

	const nodeText = sourceFile.text.slice(
		node.getStart(sourceFile),
		node.getEnd(),
	);
	return !nodeText.includes("//") && !nodeText.includes("/*");
}

function canStatementsCompleteNormally(statements: readonly AST.Statement[]) {
	return statements.every(canCompleteNormally);
}

function canSwitchCompleteNormally(statement: AST.SwitchStatement) {
	const clauses = statement.caseBlock.clauses;
	if (!clauses.some((clause) => clause.kind === SyntaxKind.DefaultClause)) {
		return true;
	}

	return clauses.some((_, clauseIndex) => {
		for (const clause of clauses.slice(clauseIndex)) {
			for (const clauseStatement of clause.statements) {
				if (hasBreakTargeting(clauseStatement, statement)) {
					return true;
				}
				if (!canCompleteNormally(clauseStatement)) {
					return false;
				}
			}
		}
		return true;
	});
}

function findBreakTarget(statement: AST.BreakStatement) {
	let ancestor = parentOf(statement);
	for (;;) {
		if (statement.label) {
			if (
				ancestor.kind === SyntaxKind.LabeledStatement &&
				ancestor.label.text === statement.label.text
			) {
				return ancestor;
			}
		} else if (
			ancestor.kind === SyntaxKind.SwitchStatement ||
			isLoop(ancestor)
		) {
			return ancestor;
		}
		ancestor = parentOf(ancestor);
	}
}

function getContainingFunction(node: AST.ReturnStatement) {
	let ancestor = parentOf(node);
	while (!isFunctionBoundary(ancestor)) {
		ancestor = parentOf(ancestor);
	}
	return ancestor;
}

function hasBreakTargeting(
	statement: AST.Statement,
	target: AST.AnyNode,
): boolean {
	switch (statement.kind) {
		case SyntaxKind.Block:
			return statement.statements.some((child) =>
				hasBreakTargeting(child, target),
			);

		case SyntaxKind.BreakStatement:
			return findBreakTarget(statement) === target;

		case SyntaxKind.DoStatement:
		case SyntaxKind.ForInStatement:
		case SyntaxKind.ForOfStatement:
		case SyntaxKind.ForStatement:
		case SyntaxKind.LabeledStatement:
		case SyntaxKind.WhileStatement:
			return hasBreakTargeting(statement.statement, target);

		case SyntaxKind.IfStatement:
			return (
				hasBreakTargeting(statement.thenStatement, target) ||
				(statement.elseStatement !== undefined &&
					hasBreakTargeting(statement.elseStatement, target))
			);

		case SyntaxKind.SwitchStatement:
			return statement.caseBlock.clauses.some((clause) =>
				clause.statements.some((child) => hasBreakTargeting(child, target)),
			);

		case SyntaxKind.TryStatement:
			return (
				hasBreakTargeting(statement.tryBlock, target) ||
				(statement.catchClause !== undefined &&
					hasBreakTargeting(statement.catchClause.block, target)) ||
				(statement.finallyBlock !== undefined &&
					hasBreakTargeting(statement.finallyBlock, target))
			);

		default:
			return false;
	}
}

function hasMeaningfulContinuation(
	node: AST.AnyNode,
	functionNode: FunctionBoundary,
): boolean {
	const parent = parentOf(node);
	if (parent === functionNode) {
		return false;
	}

	switch (parent.kind) {
		case SyntaxKind.Block: {
			const index = parent.statements.indexOf(node as AST.Statement);
			return inspectStatements(
				parent.statements,
				index + 1,
				parent,
				functionNode,
			);
		}

		case SyntaxKind.CaseBlock: {
			const clauseIndex = parent.clauses.indexOf(
				node as AST.CaseOrDefaultClause,
			);
			for (const clause of parent.clauses.slice(clauseIndex + 1)) {
				if (clause.statements.length) {
					return inspectStatements(clause.statements, 0, clause, functionNode);
				}
			}
			return hasMeaningfulContinuation(parent.parent, functionNode);
		}
		case SyntaxKind.CaseClause: {
			const index = parent.statements.indexOf(node as AST.Statement);
			return inspectStatements(
				parent.statements,
				index + 1,
				parent,
				functionNode,
			);
		}

		case SyntaxKind.CatchClause:
			return hasMeaningfulContinuation(parent, functionNode);

		case SyntaxKind.DefaultClause: {
			const index = parent.statements.indexOf(node as AST.Statement);
			return inspectStatements(
				parent.statements,
				index + 1,
				parent,
				functionNode,
			);
		}

		case SyntaxKind.IfStatement:
		case SyntaxKind.LabeledStatement:
			return hasMeaningfulContinuation(parent, functionNode);

		case SyntaxKind.TryStatement:
			return parent.finallyBlock && !canCompleteNormally(parent.finallyBlock)
				? false
				: hasMeaningfulContinuation(parent, functionNode);

		default:
			return hasMeaningfulContinuation(parent, functionNode);
	}
}

function inspectStatement(
	statement: AST.Statement,
	functionNode: FunctionBoundary,
): boolean {
	switch (statement.kind) {
		case SyntaxKind.Block:
			return inspectStatements(
				statement.statements,
				0,
				statement,
				functionNode,
			);

		case SyntaxKind.BreakStatement: {
			const target = findBreakTarget(statement);
			return hasMeaningfulContinuation(target, functionNode);
		}

		case SyntaxKind.EmptyStatement:
		case SyntaxKind.FunctionDeclaration:
		case SyntaxKind.InterfaceDeclaration:
		case SyntaxKind.TypeAliasDeclaration:
			return hasMeaningfulContinuation(statement, functionNode);

		case SyntaxKind.LabeledStatement:
			return inspectStatement(statement.statement, functionNode);

		case SyntaxKind.ReturnStatement:
			return statement.expression !== undefined;

		default:
			return true;
	}
}

function inspectStatements(
	statements: readonly AST.Statement[],
	index: number,
	parent: AST.AnyNode,
	functionNode: FunctionBoundary,
): boolean {
	const statement = statements[index];
	return statement
		? inspectStatement(statement, functionNode)
		: hasMeaningfulContinuation(parent, functionNode);
}

function isFunctionBoundary(node: AST.AnyNode): node is FunctionBoundary {
	switch (node.kind) {
		case SyntaxKind.ArrowFunction:
		case SyntaxKind.Constructor:
		case SyntaxKind.FunctionDeclaration:
		case SyntaxKind.FunctionExpression:
		case SyntaxKind.GetAccessor:
		case SyntaxKind.MethodDeclaration:
		case SyntaxKind.SetAccessor:
			return true;

		default:
			return false;
	}
}

function isInsideExcludedContext(
	node: AST.ReturnStatement,
	functionNode: FunctionBoundary,
) {
	let child: AST.AnyNode = node;
	let parent = parentOf(node);
	while (parent !== functionNode) {
		if (isLoop(parent)) {
			return true;
		}
		if (
			parent.kind === SyntaxKind.TryStatement &&
			parent.finallyBlock === child
		) {
			return true;
		}
		child = parent;
		parent = parentOf(parent);
	}
	return false;
}

function isLoop(node: AST.AnyNode): node is AST.IterationStatement {
	switch (node.kind) {
		case SyntaxKind.DoStatement:
		case SyntaxKind.ForInStatement:
		case SyntaxKind.ForOfStatement:
		case SyntaxKind.ForStatement:
		case SyntaxKind.WhileStatement:
			return true;

		default:
			return false;
	}
}

function isReachable(
	node: AST.ReturnStatement,
	functionNode: FunctionBoundary,
) {
	let child: AST.AnyNode = node;
	let parent = parentOf(node);
	while (parent !== functionNode) {
		if (
			parent.kind === SyntaxKind.Block ||
			parent.kind === SyntaxKind.CaseClause ||
			parent.kind === SyntaxKind.DefaultClause
		) {
			const index = parent.statements.indexOf(child as AST.Statement);
			if (
				index !== -1 &&
				!canStatementsCompleteNormally(parent.statements.slice(0, index))
			) {
				return false;
			}
		}
		child = parent;
		parent = parentOf(parent);
	}
	return true;
}

function parentOf(node: AST.AnyNode) {
	return node.parent as AST.AnyNode;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports bare return statements that do not change control flow.",
		id: "unnecessaryReturns",
		presets: ["stylistic"],
	},
	messages: {
		unnecessaryReturn: {
			primary:
				"This bare return has the same effect as continuing control flow.",
			secondary: [
				"A function also completes with an undefined result when execution reaches its end.",
			],
			suggestions: ["Remove the return when fallthrough has the same effect."],
		},
	},
	setup(context) {
		return {
			visitors: {
				ReturnStatement(node: AST.ReturnStatement, { sourceFile }) {
					if (node.expression) {
						return;
					}

					const functionNode = getContainingFunction(node);
					if (
						!isReachable(node, functionNode) ||
						isInsideExcludedContext(node, functionNode) ||
						hasMeaningfulContinuation(node, functionNode)
					) {
						return;
					}

					const range = getTSNodeRange(node, sourceFile);
					context.report({
						fix: canFix(node, sourceFile)
							? {
									range,
									text: "",
								}
							: undefined,
						message: "unnecessaryReturn",
						range,
					});
				},
			},
		};
	},
});
