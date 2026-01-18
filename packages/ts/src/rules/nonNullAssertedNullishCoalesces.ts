import {
	type AST,
	type Checker,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as tsutils from "ts-api-utils";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function hasNoAssignmentBeforeNode(
	identifier: AST.Identifier,
	node: AST.NonNullExpression,
	sourceFile: AST.SourceFile,
	typeChecker: Checker,
): boolean {
	const symbol = typeChecker.getSymbolAtLocation(identifier);
	if (!symbol) {
		return false;
	}

	const declarations = symbol.getDeclarations();
	if (!declarations?.length) {
		return false;
	}

	const nodeEnd = node.getEnd();

	for (const declaration of declarations) {
		if (declaration.getEnd() >= nodeEnd) {
			continue;
		}

		if (ts.isVariableDeclaration(declaration)) {
			if (declaration.exclamationToken || declaration.initializer) {
				return false;
			}
		} else if (ts.isParameter(declaration) && declaration.initializer) {
			return false;
		}
	}

	const valueDeclaration = symbol.valueDeclaration;
	if (!valueDeclaration) {
		return true;
	}

	function findModifyingReference(current: ts.Node): boolean {
		if (ts.isIdentifier(current)) {
			const currentSymbol = typeChecker.getSymbolAtLocation(current);
			if (currentSymbol?.valueDeclaration === valueDeclaration) {
				const parent = current.parent;

				if (
					ts.isBinaryExpression(parent) &&
					tsutils.isAssignmentKind(parent.operatorToken.kind) &&
					parent.left === current &&
					parent.getEnd() < nodeEnd
				) {
					return true;
				}

				if (
					(ts.isPostfixUnaryExpression(parent) ||
						ts.isPrefixUnaryExpression(parent)) &&
					parent.operand === current &&
					parent.getEnd() < nodeEnd
				) {
					return true;
				}
			}
		}

		return ts.forEachChild(current, findModifyingReference) ?? false;
	}

	return !findModifyingReference(sourceFile);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports non-null assertions on the left side of nullish coalescing operators.",
		id: "nonNullAssertedNullishCoalesces",
		presets: ["logicalStrict"],
	},
	messages: {
		unnecessaryNonNullAssertion: {
			primary:
				"The nullish coalescing operator handles null and undefined, making this non-null assertion redundant.",
			secondary: [
				"The `??` operator returns its right operand when the left operand is null or undefined.",
				"Applying `!` to assert the value is non-null defeats the purpose of using `??`.",
			],
			suggestions: ["Remove the non-null assertion."],
		},
	},
	setup(context) {
		return {
			visitors: {
				NonNullExpression: (node, { sourceFile, typeChecker }) => {
					if (node.parent.kind !== ts.SyntaxKind.BinaryExpression) {
						return;
					}

					const binaryExpression = node.parent;
					if (
						binaryExpression.operatorToken.kind !==
							ts.SyntaxKind.QuestionQuestionToken ||
						binaryExpression.left !== node
					) {
						return;
					}

					const innerExpression = node.expression;

					if (innerExpression.kind === ts.SyntaxKind.Identifier) {
						if (
							hasNoAssignmentBeforeNode(
								innerExpression,
								node,
								sourceFile,
								typeChecker,
							)
						) {
							return;
						}
					}

					const range = {
						begin: node.getStart(sourceFile),
						end: node.getEnd(),
					};

					context.report({
						message: "unnecessaryNonNullAssertion",
						range,
						suggestions: [
							{
								id: "removeNonNullAssertion",
								range,
								text: innerExpression.getText(sourceFile),
							},
						],
					});
				},
			},
		};
	},
});
