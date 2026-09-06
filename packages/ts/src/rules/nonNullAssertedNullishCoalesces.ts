import {
	isAssignmentOperator,
	SyntaxKind,
} from "typescript-native/unstable/ast";

import {
	forEachChild,
	getTSNodeRange,
	typescriptLanguage,
	type AST,
	type Checker,
} from "@flint.fyi/typescript-language";

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

	const declarations = symbol.declarations;
	if (!declarations.length) {
		return false;
	}

	const nodeEnd = node.getEnd();

	for (const declarationHandle of declarations) {
		const declaration = declarationHandle.resolve() as
			| AST.Declaration
			| undefined;
		if (!declaration) {
			continue;
		}
		if (declaration.getEnd() >= nodeEnd) {
			continue;
		}

		if (declaration.kind === SyntaxKind.VariableDeclaration) {
			if (declaration.exclamationToken || declaration.initializer) {
				return false;
			}
		} else if (
			declaration.kind === SyntaxKind.Parameter &&
			declaration.initializer
		) {
			return false;
		}
	}

	const valueDeclaration = symbol.valueDeclaration?.resolve();
	if (!valueDeclaration) {
		return true;
	}

	function findModifyingReference(current: AST.AnyNode): boolean {
		if (current.kind === SyntaxKind.Identifier) {
			const currentSymbol = typeChecker.getSymbolAtLocation(current);
			if (currentSymbol?.valueDeclaration?.resolve() === valueDeclaration) {
				const parent = current.parent;

				if (
					parent.kind === SyntaxKind.BinaryExpression &&
					isAssignmentOperator(parent.operatorToken.kind) &&
					parent.left === current &&
					parent.getEnd() < nodeEnd
				) {
					return true;
				}

				if (
					(parent.kind === SyntaxKind.PostfixUnaryExpression ||
						parent.kind === SyntaxKind.PrefixUnaryExpression) &&
					parent.operand === current &&
					parent.getEnd() < nodeEnd
				) {
					return true;
				}
			}
		}

		return forEachChild(current, findModifyingReference) ?? false;
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
				NonNullExpression: (node, { typeChecker, sourceFile }) => {
					if (
						node.parent.kind !== SyntaxKind.BinaryExpression ||
						node.parent.operatorToken.kind !==
							SyntaxKind.QuestionQuestionToken ||
						node.parent.left !== node
					) {
						return;
					}

					if (
						node.expression.kind === SyntaxKind.Identifier &&
						hasNoAssignmentBeforeNode(
							node.expression,
							node,
							sourceFile,
							typeChecker,
						)
					) {
						return;
					}

					const range = getTSNodeRange(node, sourceFile);

					context.report({
						message: "unnecessaryNonNullAssertion",
						range,
						suggestions: [
							{
								id: "removeNonNullAssertion",
								range,
								text: node.expression.getText(sourceFile),
							},
						],
					});
				},
			},
		};
	},
});
