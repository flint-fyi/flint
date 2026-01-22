import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

const COMPOUND_OPERATORS = new Set([
	ts.SyntaxKind.AsteriskAsteriskEqualsToken,
	ts.SyntaxKind.AsteriskEqualsToken,
	ts.SyntaxKind.MinusEqualsToken,
	ts.SyntaxKind.PercentEqualsToken,
	ts.SyntaxKind.PlusEqualsToken,
	ts.SyntaxKind.SlashEqualsToken,
]);

const UNNECESSARY_OPERATORS = new Set([
	ts.SyntaxKind.AmpersandAmpersandEqualsToken,
	ts.SyntaxKind.BarBarEqualsToken,
	ts.SyntaxKind.EqualsToken,
	ts.SyntaxKind.QuestionQuestionEqualsToken,
]);

function getIdentifierName(expr: ts.Expression): string | undefined {
	let cur: ts.Expression = expr;
	while (true) {
		if (ts.isParenthesizedExpression(cur)) {
			cur = cur.expression;
			continue;
		}
		if (ts.isNonNullExpression(cur)) {
			cur = cur.expression;
			continue;
		}
		if (ts.isAsExpression(cur)) {
			cur = cur.expression;
			continue;
		}
		break;
	}
	return ts.isIdentifier(cur) ? cur.text : undefined;
}

function getNearestFunctionLike(
	node: ts.Node,
): ts.FunctionLikeDeclaration | undefined {
	let cur = node.parent as ts.Node | undefined;
	while (cur) {
		if (
			ts.isArrowFunction(cur) ||
			ts.isFunctionDeclaration(cur) ||
			ts.isFunctionExpression(cur) ||
			ts.isMethodDeclaration(cur) ||
			ts.isConstructorDeclaration(cur) ||
			ts.isGetAccessorDeclaration(cur) ||
			ts.isSetAccessorDeclaration(cur)
		) {
			return cur;
		}
		cur = cur.parent as ts.Node | undefined;
	}
	return undefined;
}

function getParameterPropertyNames(
	ctor: ts.ConstructorDeclaration,
): Set<string> {
	const names = new Set<string>();
	for (const param of ctor.parameters) {
		if (ts.isIdentifier(param.name) && isParameterProperty(param)) {
			names.add(param.name.text);
		}
	}
	return names;
}

function getThisPropertyName(expr: ts.Expression): string | undefined {
	if (ts.isPropertyAccessExpression(expr)) {
		if (expr.expression.kind !== ts.SyntaxKind.ThisKeyword) {
			return undefined;
		}
		return ts.isIdentifier(expr.name) ? expr.name.text : undefined;
	}

	if (ts.isElementAccessExpression(expr)) {
		if (expr.expression.kind !== ts.SyntaxKind.ThisKeyword) {
			return undefined;
		}
		const arg = expr.argumentExpression;
		if (ts.isStringLiteral(arg)) {
			return arg.text;
		}
		if (ts.isNoSubstitutionTemplateLiteral(arg)) {
			return arg.text;
		}
		return undefined;
	}

	return undefined;
}

function hasPriorCompoundWrite(
	ctor: ts.ConstructorDeclaration,
	targetName: string,
	beforeNode: ts.Node,
): boolean {
	if (!ctor.body) {
		return false;
	}

	const statements = ctor.body.statements;
	const beforeStmtIndex = statements.findIndex(
		(s) => s.pos <= beforeNode.pos && s.end >= beforeNode.end,
	);
	if (beforeStmtIndex <= 0) {
		return false;
	}

	const hasCompoundWrite = (n: ts.Node, root: ts.Node): boolean => {
		if (n !== root && (ts.isFunctionLike(n) || ts.isClassLike(n))) {
			return false;
		}

		if (ts.isBinaryExpression(n)) {
			const lhs = getThisPropertyName(n.left);
			if (lhs === targetName && COMPOUND_OPERATORS.has(n.operatorToken.kind)) {
				return true;
			}
		}

		return (
			ts.forEachChild(n, (child) => hasCompoundWrite(child, root)) ?? false
		);
	};

	for (let i = 0; i < beforeStmtIndex; i++) {
		const stmt = statements[i];
		if (!stmt) {
			continue;
		}
		if (hasCompoundWrite(stmt, stmt)) {
			return true;
		}
	}

	return false;
}

function isIIFE(node: ts.FunctionLikeDeclaration): boolean {
	if (!ts.isArrowFunction(node) && !ts.isFunctionExpression(node)) {
		return false;
	}
	let parent: ts.Node = node.parent;
	while (ts.isParenthesizedExpression(parent)) {
		parent = parent.parent;
	}
	return ts.isCallExpression(parent);
}

function isParameterProperty(param: ts.ParameterDeclaration): boolean {
	const mods = ts.getModifiers(param);
	if (!mods) {
		return false;
	}
	return mods.some(
		(m) =>
			m.kind === ts.SyntaxKind.PrivateKeyword ||
			m.kind === ts.SyntaxKind.ProtectedKeyword ||
			m.kind === ts.SyntaxKind.PublicKeyword ||
			m.kind === ts.SyntaxKind.ReadonlyKeyword,
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Disallow unnecessary assignment of constructor parameter property.",
		id: "parameterPropertyAssignment",
		presets: ["logical"],
	},
	messages: {
		unnecessaryParameterPropertyAssignment: {
			primary:
				"This assignment is unnecessary since it is already assigned by a parameter property.",
			secondary: [
				"Assigning a parameter property to itself is redundant.",
				"The parameter property syntax already assigns the value to the class instance.",
			],
			suggestions: ["Remove the unnecessary assignment."],
		},
	},
	setup(context) {
		return {
			visitors: {
				BinaryExpression: (node, { sourceFile }) => {
					if (!UNNECESSARY_OPERATORS.has(node.operatorToken.kind)) {
						return;
					}

					const lhsName = getThisPropertyName(node.left);
					if (lhsName === undefined) {
						return;
					}

					const rhsName = getIdentifierName(node.right);
					if (rhsName === undefined) {
						return;
					}

					if (lhsName !== rhsName) {
						return;
					}

					let functionNode = getNearestFunctionLike(node);
					while (functionNode && isIIFE(functionNode)) {
						functionNode = getNearestFunctionLike(functionNode);
					}

					if (!functionNode || !ts.isConstructorDeclaration(functionNode)) {
						return;
					}

					const parameterPropertyNames =
						getParameterPropertyNames(functionNode);
					if (!parameterPropertyNames.has(rhsName)) {
						return;
					}

					if (hasPriorCompoundWrite(functionNode, rhsName, node)) {
						return;
					}

					context.report({
						message: "unnecessaryParameterPropertyAssignment",
						range: getTSNodeRange(node, sourceFile),
					});
				},
			},
		};
	},
});
