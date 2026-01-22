import {
	type AST,
	type Checker,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as tsutils from "ts-api-utils";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";
import { getConstrainedTypeAtLocation } from "./utils/getConstrainedType.ts";

function isArrayType(type: ts.Type, typeChecker: Checker) {
	return tsutils
		.unionConstituents(type)
		.every((unionPart) =>
			tsutils
				.intersectionConstituents(unionPart)
				.every((t) => typeChecker.isArrayType(t) || typeChecker.isTupleType(t)),
		);
}

function isTypeAssertion(
	node: AST.Expression,
): node is AST.AsExpression | AST.TypeAssertion {
	return (
		node.kind === ts.SyntaxKind.AsExpression ||
		node.kind === ts.SyntaxKind.TypeAssertionExpression
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports `Array#reduce` calls using type assertions on initial values instead of type parameters.",
		id: "reduceTypeParameters",
		presets: ["logicalStrict"],
	},
	messages: {
		preferTypeParameter: {
			primary:
				"Prefer a type parameter over a type assertion on the initial value.",
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
						!ts.isPropertyAccessExpression(node.expression) &&
						!ts.isElementAccessExpression(node.expression)
					) {
						return;
					}

					const methodName = ts.isPropertyAccessExpression(node.expression)
						? node.expression.name.text
						: ts.isStringLiteral(node.expression.argumentExpression)
							? node.expression.argumentExpression.text
							: undefined;

					if (methodName !== "reduce") {
						return;
					}

					const secondArg = node.arguments[1];
					if (!secondArg || !isTypeAssertion(secondArg)) {
						return;
					}

					const calleeObjectType = getConstrainedTypeAtLocation(
						node.expression.expression,
						typeChecker,
					);
					if (!isArrayType(calleeObjectType, typeChecker)) {
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

					if (secondArg.kind === ts.SyntaxKind.AsExpression) {
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
