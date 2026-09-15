import ts, { SyntaxKind } from "typescript";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { countCommentsInRange } from "./utils/countCommentsInRange.ts";

function formatKey(key: number | string) {
	if (typeof key === "string") {
		return JSON.stringify(key)
			.replaceAll("\u2028", "\\u2028")
			.replaceAll("\u2029", "\\u2029");
	}

	if (Number.isFinite(key) && key >= 0) {
		return String(key);
	}

	return JSON.stringify(String(key));
}

function hasStaticModifier(node: ts.Node) {
	return (
		ts.canHaveModifiers(node) &&
		ts
			.getModifiers(node)
			?.some((modifier) => modifier.kind === SyntaxKind.StaticKeyword)
	);
}

function isAssignmentPattern(objectLiteral: AST.ObjectLiteralExpression) {
	let current: ts.Node = objectLiteral;

	while (true) {
		const parent = current.parent;
		if (ts.isBinaryExpression(parent)) {
			return (
				parent.operatorToken.kind === SyntaxKind.EqualsToken &&
				parent.left === current
			);
		}

		if (ts.isForInStatement(parent) || ts.isForOfStatement(parent)) {
			return parent.initializer === current;
		}

		switch (parent.kind) {
			case SyntaxKind.ArrayLiteralExpression:
				current = parent;
				break;

			case SyntaxKind.ObjectLiteralExpression:
				current = parent;
				break;

			case SyntaxKind.PropertyAssignment:
				current = parent;
				break;

			default:
				return false;
		}
	}
}

function isEvaluationSafe(node: AST.Expression): boolean {
	switch (node.kind) {
		case SyntaxKind.AsExpression:
		case SyntaxKind.NonNullExpression:
		case SyntaxKind.ParenthesizedExpression:
		case SyntaxKind.SatisfiesExpression:
			return isEvaluationSafe(node.expression);

		case SyntaxKind.Identifier:
		case SyntaxKind.NoSubstitutionTemplateLiteral:
		case SyntaxKind.NumericLiteral:
		case SyntaxKind.StringLiteral:
			return true;
		case SyntaxKind.PrefixUnaryExpression:
			return (
				(node.operator === SyntaxKind.MinusToken ||
					node.operator === SyntaxKind.PlusToken) &&
				isEvaluationSafe(node.operand)
			);

		case SyntaxKind.TypeAssertionExpression:
			return isEvaluationSafe(node.expression);

		default:
			return false;
	}
}

function isSupportedParent(node: AST.ComputedPropertyName) {
	switch (node.parent.kind) {
		case SyntaxKind.BindingElement:
			return node.parent.propertyName === node;

		case SyntaxKind.GetAccessor:
		case SyntaxKind.MethodDeclaration:
		case SyntaxKind.MethodSignature:
		case SyntaxKind.PropertyAssignment:
		case SyntaxKind.PropertyDeclaration:
		case SyntaxKind.PropertySignature:
		case SyntaxKind.SetAccessor:
			return node.parent.name === node;
		default:
			return false;
	}
}

function preservesSemantics(
	node: AST.ComputedPropertyName,
	key: number | string,
) {
	const parent = node.parent;
	if (parent.kind === SyntaxKind.PropertyAssignment && key === "__proto__") {
		return !isAssignmentPattern(parent.parent);
	}

	if (
		parent.kind !== SyntaxKind.GetAccessor &&
		parent.kind !== SyntaxKind.MethodDeclaration &&
		parent.kind !== SyntaxKind.PropertyDeclaration &&
		parent.kind !== SyntaxKind.SetAccessor
	) {
		return false;
	}

	if (
		parent.parent.kind !== SyntaxKind.ClassDeclaration &&
		parent.parent.kind !== SyntaxKind.ClassExpression
	) {
		return false;
	}

	const isStatic = !!hasStaticModifier(parent);
	if (key === "prototype" && isStatic) {
		return true;
	}

	return (
		key === "constructor" &&
		(parent.kind === SyntaxKind.PropertyDeclaration ||
			(parent.kind === SyntaxKind.MethodDeclaration && !isStatic))
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports computed property keys that can be written as literal property names.",
		id: "unnecessaryComputedKeys",
		presets: ["stylistic"],
	},
	messages: {
		unnecessaryComputedKey: {
			primary: "This computed key has the single literal value {{ key }}.",
			secondary: [
				"Literal property names express the same key without computed-name syntax.",
			],
			suggestions: ["Write the key as the literal property name {{ key }}."],
		},
	},
	setup(context) {
		return {
			visitors: {
				ComputedPropertyName: (node, { sourceFile, typeChecker }) => {
					if (!isSupportedParent(node) || !isEvaluationSafe(node.expression)) {
						return;
					}

					const type = typeChecker.getTypeAtLocation(node.expression);
					const key = type.isStringLiteral()
						? type.value
						: type.isNumberLiteral()
							? type.value
							: undefined;
					if (key === undefined || preservesSemantics(node, key)) {
						return;
					}

					const range = getTSNodeRange(node, sourceFile);
					const replacement = formatKey(key);
					context.report({
						data: { key: replacement },
						fix: countCommentsInRange(sourceFile.text, range)
							? undefined
							: { range, text: replacement },
						message: "unnecessaryComputedKey",
						range,
					});
				},
			},
		};
	},
});
