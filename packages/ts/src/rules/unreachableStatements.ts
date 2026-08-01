import * as ts from "typescript";

import {
	forEachChild,
	getTSNodeRange,
	typescriptLanguage,
	type AST,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

interface Completion {
	breaks: Set<ts.Node>;
	canCompleteNormally: boolean;
	canReturn: boolean;
	canThrow: boolean;
	continues: Set<ts.Node>;
}

function abruptCompletion(properties: Partial<Completion>): Completion {
	return { ...normalCompletion(), ...properties, canCompleteNormally: false };
}

function consumeTarget(
	completion: Completion,
	property: "breaks" | "continues",
	target: ts.Node,
) {
	const outcomes = new Set(completion[property]);
	const consumed = outcomes.delete(target);
	return {
		...completion,
		canCompleteNormally: completion.canCompleteNormally || consumed,
		[property]: outcomes,
	};
}

function getExecutionRootStatements(node: AST.AnyNode) {
	switch (node.kind) {
		case ts.SyntaxKind.ArrowFunction:
			return node.body.kind === ts.SyntaxKind.Block
				? node.body.statements
				: undefined;
		case ts.SyntaxKind.ClassStaticBlockDeclaration:
			return node.body.statements;
		case ts.SyntaxKind.Constructor:
		case ts.SyntaxKind.FunctionDeclaration:
		case ts.SyntaxKind.GetAccessor:
		case ts.SyntaxKind.MethodDeclaration:
		case ts.SyntaxKind.SetAccessor:
			return node.body?.statements;
		case ts.SyntaxKind.FunctionExpression:
			return node.body.statements;
		case ts.SyntaxKind.ModuleBlock:
			return node.statements;
		default:
			return undefined;
	}
}

function getLabeledIteration(statement: AST.Statement) {
	while (statement.kind === ts.SyntaxKind.LabeledStatement) {
		statement = statement.statement;
	}

	switch (statement.kind) {
		case ts.SyntaxKind.DoStatement:
		case ts.SyntaxKind.ForInStatement:
		case ts.SyntaxKind.ForOfStatement:
		case ts.SyntaxKind.ForStatement:
		case ts.SyntaxKind.WhileStatement:
			return statement;
		default:
			return undefined;
	}
}

function hasModifier(node: ts.Node, kind: ts.SyntaxKind) {
	return (
		ts.canHaveModifiers(node) &&
		ts.getModifiers(node)?.some((modifier) => modifier.kind === kind)
	);
}

function isExempt(statement: AST.Statement) {
	if (
		statement.kind === ts.SyntaxKind.EmptyStatement ||
		statement.kind === ts.SyntaxKind.FunctionDeclaration ||
		statement.kind === ts.SyntaxKind.InterfaceDeclaration ||
		statement.kind === ts.SyntaxKind.TypeAliasDeclaration ||
		statement.kind === ts.SyntaxKind.ModuleDeclaration ||
		statement.kind === ts.SyntaxKind.NamespaceExportDeclaration
	) {
		return true;
	}
	if (hasModifier(statement, ts.SyntaxKind.DeclareKeyword)) {
		return true;
	}
	if (
		statement.kind === ts.SyntaxKind.ImportDeclaration ||
		statement.kind === ts.SyntaxKind.ImportEqualsDeclaration
	) {
		return isTypeOnlyImport(statement);
	}
	if (statement.kind === ts.SyntaxKind.ExportDeclaration) {
		return isTypeOnlyExport(statement);
	}
	return (
		statement.kind === ts.SyntaxKind.VariableStatement &&
		(statement.declarationList.flags & ts.NodeFlags.BlockScoped) === 0 &&
		statement.declarationList.declarations.every(
			(declaration) => !declaration.initializer,
		)
	);
}

function isTypeOnlyExport(statement: AST.ExportDeclaration) {
	if (statement.isTypeOnly) {
		return true;
	}
	return (
		statement.exportClause?.kind === ts.SyntaxKind.NamedExports &&
		!!statement.exportClause.elements.length &&
		statement.exportClause.elements.every((element) => element.isTypeOnly)
	);
}

function isTypeOnlyImport(
	statement: AST.ImportDeclaration | AST.ImportEqualsDeclaration,
) {
	if (statement.kind === ts.SyntaxKind.ImportEqualsDeclaration) {
		return statement.isTypeOnly;
	}

	const clause = statement.importClause;
	if (!clause) {
		return false;
	}
	if (clause.phaseModifier === ts.SyntaxKind.TypeKeyword) {
		return true;
	}
	return (
		!clause.name &&
		clause.namedBindings?.kind === ts.SyntaxKind.NamedImports &&
		!!clause.namedBindings.elements.length &&
		clause.namedBindings.elements.every((element) => element.isTypeOnly)
	);
}

function mergeAlternatives(...completions: Completion[]): Completion {
	return {
		breaks: new Set(
			completions.flatMap((completion) => [...completion.breaks]),
		),
		canCompleteNormally: completions.some(
			(completion) => completion.canCompleteNormally,
		),
		canReturn: completions.some((completion) => completion.canReturn),
		canThrow: completions.some((completion) => completion.canThrow),
		continues: new Set(
			completions.flatMap((completion) => [...completion.continues]),
		),
	};
}

function normalCompletion(): Completion {
	return {
		breaks: new Set(),
		canCompleteNormally: true,
		canReturn: false,
		canThrow: false,
		continues: new Set(),
	};
}

function sequence(first: Completion, second: Completion): Completion {
	if (!first.canCompleteNormally) {
		return first;
	}

	return {
		breaks: new Set([...first.breaks, ...second.breaks]),
		canCompleteNormally: second.canCompleteNormally,
		canReturn: first.canReturn || second.canReturn,
		canThrow: first.canThrow || second.canThrow,
		continues: new Set([...first.continues, ...second.continues]),
	};
}

function unwrapTrueExpression(expression: ts.Expression): boolean {
	switch (expression.kind) {
		case ts.SyntaxKind.AsExpression:
		case ts.SyntaxKind.NonNullExpression:
		case ts.SyntaxKind.ParenthesizedExpression:
		case ts.SyntaxKind.SatisfiesExpression:
		case ts.SyntaxKind.TypeAssertionExpression:
			return unwrapTrueExpression((expression as ts.AsExpression).expression);
		default:
			return expression.kind === ts.SyntaxKind.TrueKeyword;
	}
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports statements that cannot be reached during execution.",
		id: "unreachableStatements",
		presets: ["javascript"],
	},
	messages: {
		unreachableStatement: {
			primary: "No control flow path can reach this statement.",
			secondary: [
				"Statements after unconditional control flow such as return, throw, or an infinite loop cannot execute.",
				"Unreachable code can conceal mistakes and makes the intended control flow harder to understand.",
			],
			suggestions: [
				"Remove the unreachable statement or change the preceding control flow so that the statement can execute.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				SourceFile: (sourceFile) => {
					if (sourceFile.isDeclarationFile) {
						return;
					}

					const breakTargets: ts.Node[] = [];
					const continueTargets: ts.Node[] = [];
					const labels = new Map<
						string,
						{ breakTarget: ts.Node; continueTarget: ts.Node | undefined }
					>();

					const analyzeStatementList = (
						statements: readonly AST.Statement[],
					) => {
						let completion = normalCompletion();
						for (const statement of statements) {
							if (!completion.canCompleteNormally) {
								if (isExempt(statement)) {
									continue;
								}
								context.report({
									message: "unreachableStatement",
									range: getTSNodeRange(statement, sourceFile),
								});
								break;
							}
							completion = sequence(completion, analyzeStatement(statement));
						}
						return completion;
					};

					const analyzeLoop = (
						node: AST.IterationStatement,
						canSkip: boolean,
						conditionCanExit: boolean,
					) => {
						breakTargets.push(node);
						continueTargets.push(node);
						let body = analyzeStatement(node.statement);
						continueTargets.pop();
						breakTargets.pop();
						body = consumeTarget(body, "continues", node);
						const hadBreak = body.breaks.has(node);
						body = consumeTarget(body, "breaks", node);
						return {
							...body,
							canCompleteNormally:
								canSkip ||
								hadBreak ||
								(conditionCanExit && body.canCompleteNormally),
						};
					};

					const getLoopExits = (node: AST.IterationStatement) => {
						if (
							node.kind === ts.SyntaxKind.ForInStatement ||
							node.kind === ts.SyntaxKind.ForOfStatement
						) {
							return { canSkip: true, conditionCanExit: true };
						}
						if (node.kind === ts.SyntaxKind.DoStatement) {
							return {
								canSkip: false,
								conditionCanExit: !unwrapTrueExpression(node.expression),
							};
						}
						const condition =
							node.kind === ts.SyntaxKind.WhileStatement
								? node.expression
								: node.condition;
						const conditionCanExit =
							!!condition && !unwrapTrueExpression(condition);
						return { canSkip: conditionCanExit, conditionCanExit };
					};

					const analyzeLoopWithExits = (node: AST.IterationStatement) => {
						const { canSkip, conditionCanExit } = getLoopExits(node);
						return analyzeLoop(node, canSkip, conditionCanExit);
					};

					const analyzeStatement = (statement: AST.Statement): Completion => {
						switch (statement.kind) {
							case ts.SyntaxKind.Block:
								return analyzeStatementList(statement.statements);
							case ts.SyntaxKind.BreakStatement: {
								const target = statement.label
									? labels.get(statement.label.text)?.breakTarget
									: breakTargets.at(-1);
								return target
									? abruptCompletion({ breaks: new Set([target]) })
									: abruptCompletion({});
							}
							case ts.SyntaxKind.ContinueStatement: {
								const target = statement.label
									? labels.get(statement.label.text)?.continueTarget
									: continueTargets.at(-1);
								return target
									? abruptCompletion({ continues: new Set([target]) })
									: abruptCompletion({});
							}
							case ts.SyntaxKind.DoStatement:
								return analyzeLoopWithExits(statement);
							case ts.SyntaxKind.ForInStatement:
							case ts.SyntaxKind.ForOfStatement:
								return analyzeLoopWithExits(statement);
							case ts.SyntaxKind.ForStatement:
								return analyzeLoopWithExits(statement);
							case ts.SyntaxKind.IfStatement:
								return mergeAlternatives(
									analyzeStatement(statement.thenStatement),
									statement.elseStatement
										? analyzeStatement(statement.elseStatement)
										: normalCompletion(),
								);
							case ts.SyntaxKind.LabeledStatement: {
								labels.set(statement.label.text, {
									breakTarget: statement,
									continueTarget: getLabeledIteration(statement.statement),
								});
								const completion = analyzeStatement(statement.statement);
								labels.delete(statement.label.text);
								return consumeTarget(completion, "breaks", statement);
							}
							case ts.SyntaxKind.ReturnStatement:
								return abruptCompletion({ canReturn: true });
							case ts.SyntaxKind.SwitchStatement: {
								breakTargets.push(statement);
								const clauseCompletions = statement.caseBlock.clauses.map(
									(clause) => ({
										clause,
										completion: analyzeStatementList(clause.statements),
									}),
								);
								let following = normalCompletion();
								let dispatch = abruptCompletion({});
								let hasDefault = false;
								for (const {
									clause,
									completion,
								} of clauseCompletions.toReversed()) {
									hasDefault ||= clause.kind === ts.SyntaxKind.DefaultClause;
									following = sequence(completion, following);
									dispatch = mergeAlternatives(dispatch, following);
								}
								breakTargets.pop();
								if (!hasDefault) {
									dispatch = mergeAlternatives(dispatch, normalCompletion());
								}
								return consumeTarget(dispatch, "breaks", statement);
							}
							case ts.SyntaxKind.ThrowStatement:
								return abruptCompletion({ canThrow: true });
							case ts.SyntaxKind.TryStatement: {
								let pending = analyzeStatement(statement.tryBlock);
								if (statement.catchClause) {
									pending = mergeAlternatives(
										{ ...pending, canThrow: false },
										analyzeStatement(statement.catchClause.block),
									);
								}
								if (!statement.finallyBlock) {
									return pending;
								}
								const finalizer = analyzeStatement(statement.finallyBlock);
								return finalizer.canCompleteNormally
									? sequence(finalizer, pending)
									: finalizer;
							}
							case ts.SyntaxKind.WhileStatement:
								return analyzeLoopWithExits(statement);
							case ts.SyntaxKind.WithStatement:
								return analyzeStatement(statement.statement);
							default:
								return normalCompletion();
						}
					};

					analyzeStatementList(sourceFile.statements);
					forEachChild(sourceFile, function analyzeExecutionRoots(node) {
						const statements = getExecutionRootStatements(node);
						if (statements) {
							analyzeStatementList(statements);
						}
						forEachChild(node, analyzeExecutionRoots);
					});
				},
			},
		};
	},
});
