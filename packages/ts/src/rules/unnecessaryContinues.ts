import ts, { SyntaxKind } from "typescript";

import { typescriptLanguage } from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { countCommentsInRange } from "./utils/countCommentsInRange.ts";

function findTarget(node: ts.ContinueStatement) {
	let current: ts.Node = node.parent;

	if (!node.label) {
		while (!isControlFlowBoundary(current)) {
			if (ts.isIterationStatement(current, false)) {
				return current;
			}
			current = current.parent;
		}
		return undefined;
	}

	while (!isControlFlowBoundary(current)) {
		if (
			ts.isLabeledStatement(current) &&
			current.label.text === node.label.text
		) {
			let statement = current.statement;
			while (ts.isLabeledStatement(statement)) {
				statement = statement.statement;
			}
			return ts.isIterationStatement(statement, false) ? statement : undefined;
		}
		current = current.parent;
	}
	return undefined;
}

function isControlFlowBoundary(node: ts.Node) {
	return (
		node.kind === SyntaxKind.SourceFile ||
		node.kind === SyntaxKind.ClassStaticBlockDeclaration ||
		ts.isFunctionLike(node)
	);
}

function isLastStatement(
	current: ts.Node,
	statements: ts.NodeArray<ts.Statement>,
) {
	return statements.at(-1) === current;
}

function isStatementListParent(node: ts.ContinueStatement) {
	const parent = node.parent;
	return (
		ts.isBlock(parent) ||
		ts.isCaseOrDefaultClause(parent) ||
		ts.isModuleBlock(parent) ||
		ts.isSourceFile(parent)
	);
}

function reachesTarget(
	node: ts.ContinueStatement,
	target: ts.IterationStatement,
) {
	let current: ts.Node = node;

	while (current !== target) {
		const parent = current.parent;

		if (ts.isBlock(parent)) {
			if (!isLastStatement(current, parent.statements)) {
				return false;
			}
			if (
				ts.isTryStatement(parent.parent) &&
				parent.parent.finallyBlock === parent
			) {
				return false;
			}
			current = parent;
			continue;
		}

		if (ts.isCaseOrDefaultClause(parent)) {
			if (!isLastStatement(current, parent.statements)) {
				return false;
			}
			const clauses = parent.parent.clauses;
			const clauseIndex = clauses.indexOf(parent);
			if (
				clauses
					.slice(clauseIndex + 1)
					.some((clause) => clause.statements.length)
			) {
				return false;
			}
			current = parent.parent.parent;
			continue;
		}

		if (ts.isCatchClause(parent)) {
			current = parent.parent;
			continue;
		}

		if (
			(ts.isIfStatement(parent) &&
				(parent.thenStatement === current ||
					parent.elseStatement === current)) ||
			(ts.isLabeledStatement(parent) && parent.statement === current) ||
			(ts.isWithStatement(parent) && parent.statement === current)
		) {
			current = parent;
			continue;
		}

		if (ts.isTryStatement(parent)) {
			current = parent;
			continue;
		}

		/* v8 ignore else -- all supported paths end at an iteration statement */
		if (ts.isIterationStatement(parent, false)) {
			return parent === target;
		}

		/* v8 ignore next -- continue statements cannot have other statement parents */
		return false;
	}

	/* v8 ignore next -- the starting node cannot itself be an iteration statement */
	return target.statement === current;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports `continue` statements that do not change control flow.",
		id: "unnecessaryContinues",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		unnecessaryContinue: {
			primary: "This `continue` statement does not change control flow.",
			secondary: [
				"Normal completion of the surrounding statements reaches the same loop continuation point.",
			],
			suggestions: ["Remove the unnecessary `continue` statement."],
		},
	},
	setup(context) {
		return {
			visitors: {
				ContinueStatement: (node, { sourceFile }) => {
					const target = findTarget(node);
					if (!target || !reachesTarget(node, target)) {
						return;
					}

					const replacementRange = {
						begin: node.getStart(sourceFile),
						end: node.getEnd(),
					};
					const fix = countCommentsInRange(sourceFile.text, replacementRange)
						? undefined
						: {
								range: replacementRange,
								text: isStatementListParent(node) ? "" : ";",
							};

					context.report({
						fix,
						message: "unnecessaryContinue",
						range: {
							begin: node.getStart(sourceFile),
							end: node.getStart(sourceFile) + "continue".length,
						},
					});
				},
			},
		};
	},
});
