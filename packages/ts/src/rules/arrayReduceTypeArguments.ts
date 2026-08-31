import { SyntaxKind } from "typescript";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { isArrayOrTupleTypeAtLocation } from "./utils/isArrayOrTupleTypeAtLocation.ts";

function isTypeAssertion(
	node: AST.Expression,
): node is AST.AsExpression | AST.TypeAssertion {
	return (
		node.kind === SyntaxKind.AsExpression ||
		node.kind === SyntaxKind.TypeAssertionExpression
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports `Array#reduce` calls using type assertions on initial values instead of type arguments.",
		id: "arrayReduceTypeArguments",
		presets: ["logicalStrict"],
	},
	messages: {
		preferTypeParameter: {
			primary:
				"Using a type assertion on a reducer's initial value is less type-safe than providing a type parameter.",
			secondary: [
				"Using `Array#reduce<T>` with a type parameter is clearer than asserting the initial value type.",
				"This avoids unnecessary type assertions and keeps generic inference consistent.",
			],
			suggestions: [
				"Replace the type assertion with a type parameter on `reduce`.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression: (node, { sourceFile, typeChecker }) => {
					if (
						node.expression.kind !== SyntaxKind.PropertyAccessExpression &&
						node.expression.kind !== SyntaxKind.ElementAccessExpression
					) {
						return;
					}

					const methodName =
						node.expression.kind === SyntaxKind.PropertyAccessExpression
							? node.expression.name.text
							: node.expression.argumentExpression.kind ===
								  SyntaxKind.StringLiteral
								? node.expression.argumentExpression.text
								: undefined;

					if (methodName !== "reduce" || node.arguments.length < 2) {
						return;
					}

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const secondArg = node.arguments[1]!;

					if (!isTypeAssertion(secondArg)) {
						return;
					}

					if (
						!isArrayOrTupleTypeAtLocation(
							node.expression.expression,
							typeChecker,
						)
					) {
						return;
					}

					const initializerType = typeChecker.getTypeAtLocation(
						secondArg.expression,
					);
					const assertedType = typeChecker.getTypeAtLocation(secondArg.type);

					if (!typeChecker.isTypeAssignableTo(initializerType, assertedType)) {
						return;
					}

					const typeAnnotationText = secondArg.type.getText(sourceFile);
					const fixes = [];

					if (!node.typeArguments) {
						fixes.push({
							range: {
								begin: node.expression.getEnd(),
								end: node.expression.getEnd(),
							},
							text: `<${typeAnnotationText}>`,
						});
					}

					if (secondArg.kind === SyntaxKind.AsExpression) {
						fixes.push({
							range: {
								begin: secondArg.expression.getEnd(),
								end: secondArg.getEnd(),
							},
							text: "",
						});
					} else {
						fixes.push({
							range: {
								begin: secondArg.getStart(sourceFile),
								end: secondArg.expression.getStart(sourceFile),
							},
							text: "",
						});
					}

					context.report({
						fix: fixes,
						message: "preferTypeParameter",
						range: getTSNodeRange(secondArg, sourceFile),
					});
				},
			},
		};
	},
});
