import {
	type AST,
	type Checker,
	getTSNodeRange,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as tsutils from "ts-api-utils";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function couldBeNullish(type: ts.Type): boolean {
	if (type.flags & ts.TypeFlags.TypeParameter) {
		const constraint = type.getConstraint();
		return constraint === undefined || couldBeNullish(constraint);
	}

	if (tsutils.isUnionType(type)) {
		return type.types.some(couldBeNullish);
	}

	return (type.flags & (ts.TypeFlags.Null | ts.TypeFlags.Undefined)) !== 0;
}

function getTypesIfNotLoose(
	node: AST.Expression | AST.TypeNode,
	typeChecker: Checker,
) {
	const type = typeChecker.getTypeAtLocation(node);
	if (tsutils.isTypeFlagSet(type, ts.TypeFlags.Any | ts.TypeFlags.Unknown)) {
		return undefined;
	}

	return tsutils.unionConstituents(type);
}

function isConstAssertion(
	node: AST.AsExpression | AST.TypeAssertion,
	sourceFile: AST.SourceFile,
) {
	return (
		node.type.kind === ts.SyntaxKind.TypeReference &&
		node.type.typeName.kind === ts.SyntaxKind.Identifier &&
		node.type.typeName.getText(sourceFile) === "const"
	);
}

function needsParentheses(expression: AST.Expression) {
	switch (expression.kind) {
		case ts.SyntaxKind.ArrowFunction:
		case ts.SyntaxKind.AwaitExpression:
		case ts.SyntaxKind.BinaryExpression:
		case ts.SyntaxKind.ConditionalExpression:
		case ts.SyntaxKind.PrefixUnaryExpression:
		case ts.SyntaxKind.YieldExpression:
			return true;
		default:
			return false;
	}
}

function sameTypeWithoutNullish(
	assertedTypes: ts.Type[],
	originalTypes: ts.Type[],
) {
	const nonNullishOriginalTypes = originalTypes.filter(
		(type) => (type.flags & (ts.TypeFlags.Null | ts.TypeFlags.Undefined)) === 0,
	);

	if (nonNullishOriginalTypes.length === originalTypes.length) {
		return false;
	}

	for (const assertedType of assertedTypes) {
		if (
			couldBeNullish(assertedType) ||
			!nonNullishOriginalTypes.includes(assertedType)
		) {
			return false;
		}
	}

	for (const originalType of nonNullishOriginalTypes) {
		if (!assertedTypes.includes(originalType)) {
			return false;
		}
	}

	return true;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports type assertions that can be replaced with non-null assertions.",
		id: "nonNullableTypeAssertions",
		presets: ["stylistic", "stylisticStrict"],
	},
	messages: {
		preferNonNullAssertion: {
			primary:
				"Use a non-null assertion (`!`) instead of an explicit type assertion.",
			secondary: [
				"When the only difference between the original and asserted type is nullability, a non-null assertion is more concise.",
				"Non-null assertions clearly communicate that you're asserting the value is not null or undefined.",
			],
			suggestions: ["Replace the type assertion with a `!` assertion."],
		},
	},
	setup(context) {
		function checkNode(
			node: AST.AsExpression | AST.TypeAssertion,
			{ sourceFile, typeChecker }: TypeScriptFileServices,
		) {
			if (isConstAssertion(node, sourceFile)) {
				return;
			}

			const originalTypes = getTypesIfNotLoose(node.expression, typeChecker);
			if (!originalTypes) {
				return;
			}

			const assertedTypes = getTypesIfNotLoose(node.type, typeChecker);
			if (
				!assertedTypes ||
				!sameTypeWithoutNullish(assertedTypes, originalTypes)
			) {
				return;
			}

			const expressionText = node.expression.getText(sourceFile);
			const replacement = needsParentheses(node.expression)
				? `(${expressionText})!`
				: `${expressionText}!`;

			context.report({
				fix: {
					range: getTSNodeRange(node, sourceFile),
					text: replacement,
				},
				message: "preferNonNullAssertion",
				range: getTSNodeRange(node, sourceFile),
			});
		}

		return {
			visitors: {
				AsExpression: checkNode,
				TypeAssertionExpression: checkNode,
			},
		};
	},
});
