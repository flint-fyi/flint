import { SyntaxKind } from "typescript-native/unstable/ast";
import { TypeFlags, type Type } from "typescript-native/unstable/sync";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
	type Checker,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

function couldBeNullish(type: Type): boolean {
	if (type.isTypeParameter()) {
		const constraint = type.getConstraint();
		return constraint === undefined || couldBeNullish(constraint);
	}

	if (type.isUnionType()) {
		return type.getTypes().some(couldBeNullish);
	}

	return (type.flags & (TypeFlags.Null | TypeFlags.Undefined)) !== 0;
}

function getTypesIfNotLoose(
	node: AST.Expression | AST.TypeNode,
	typeChecker: Checker,
) {
	const type = typeChecker.getTypeAtLocation(node);
	if ((type.flags & (TypeFlags.Any | TypeFlags.Unknown)) !== 0) {
		return undefined;
	}

	return type.isUnionType() ? type.getTypes() : [type];
}

function isConstAssertion(
	node: AST.AsExpression | AST.TypeAssertion,
	sourceFile: AST.SourceFile,
) {
	return (
		node.type.kind === SyntaxKind.TypeReference &&
		node.type.typeName.kind === SyntaxKind.Identifier &&
		node.type.typeName.getText(sourceFile) === "const"
	);
}

function needsParentheses(expression: AST.Expression) {
	switch (expression.kind) {
		case SyntaxKind.ArrowFunction:
		case SyntaxKind.AwaitExpression:
		case SyntaxKind.BinaryExpression:
		case SyntaxKind.ConditionalExpression:
		case SyntaxKind.PrefixUnaryExpression:
		case SyntaxKind.YieldExpression:
			return true;
		default:
			return false;
	}
}

function sameTypeWithoutNullish(
	assertedTypes: readonly Type[],
	originalTypes: readonly Type[],
) {
	const nonNullishOriginalTypes = originalTypes.filter(
		(type) => (type.flags & (TypeFlags.Null | TypeFlags.Undefined)) === 0,
	);

	if (nonNullishOriginalTypes.length === originalTypes.length) {
		return false;
	}

	for (const assertedType of assertedTypes) {
		if (
			couldBeNullish(assertedType) ||
			!nonNullishOriginalTypes.some((type) => type.id === assertedType.id)
		) {
			return false;
		}
	}

	for (const originalType of nonNullishOriginalTypes) {
		if (!assertedTypes.some((type) => type.id === originalType.id)) {
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
			{ typeChecker, sourceFile }: TypeScriptFileServices,
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
