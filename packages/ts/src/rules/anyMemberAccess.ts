import { SyntaxKind } from "typescript-native/unstable/ast";
import { TypeFlags, type Type } from "typescript-native/unstable/sync";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
	type Checker,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { getConstrainedTypeAtLocation } from "./utils/getConstrainedType.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports member access on a value with type `any`.",
		id: "anyMemberAccess",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		unsafeComputedMemberAccess: {
			primary: "Computed key is {{ type }} typed.",
			secondary: [
				"Using a value typed as `any` as a computed property key bypasses TypeScript's type checking.",
				"TypeScript cannot verify that the key is valid for the object being accessed.",
			],
			suggestions: ["Ensure the computed key has a well-defined type."],
		},
		unsafeMemberAccess: {
			primary: "Unsafe member access on {{ type }} typed value.",
			secondary: [
				"Accessing a member of a value typed as `any` bypasses TypeScript's type checking.",
				"TypeScript cannot verify that the member exists or what type it has.",
			],
			suggestions: [
				"Ensure the accessed value has a well-defined type with known properties.",
			],
		},
	},
	setup(context) {
		const reportedChains = new WeakSet<AST.AnyNode>();

		// TODO (#400): Switch to scope analysis
		function isInHeritageClause(node: AST.AnyNode) {
			let current: AST.AnyNode | undefined = node.parent;

			while (current) {
				if (current.kind === SyntaxKind.HeritageClause) {
					return true;
				}

				// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- removing causes type error on the `while` loop. TSESLint bug?
				current = current.parent as AST.AnyNode | undefined;
			}

			return false;
		}

		function findRootAnyAccess(
			node: AST.ElementAccessExpression | AST.PropertyAccessExpression,
			checker: Checker,
		): AST.ElementAccessExpression | AST.PropertyAccessExpression | undefined {
			const objectType = getConstrainedTypeAtLocation(node.expression, checker);

			if (!(objectType.flags & TypeFlags.Any)) {
				return undefined;
			}

			if (
				node.expression.kind === SyntaxKind.PropertyAccessExpression ||
				node.expression.kind === SyntaxKind.ElementAccessExpression
			) {
				const deeper = findRootAnyAccess(node.expression, checker);
				if (deeper) {
					return deeper;
				}
			}

			return node;
		}

		function markChainAsReported(
			node: AST.ElementAccessExpression | AST.PropertyAccessExpression,
		) {
			reportedChains.add(node);

			if (
				node.expression.kind === SyntaxKind.PropertyAccessExpression ||
				node.expression.kind === SyntaxKind.ElementAccessExpression
			) {
				markChainAsReported(node.expression);
			}
		}

		function checkMemberExpression(
			node: AST.ElementAccessExpression | AST.PropertyAccessExpression,
			sourceFile: AST.SourceFile,
			checker: Checker,
		) {
			if (reportedChains.has(node) || isInHeritageClause(node)) {
				return;
			}

			const rootAccess = findRootAnyAccess(node, checker);
			if (!rootAccess) {
				return;
			}

			markChainAsReported(node);

			const objectType = getConstrainedTypeAtLocation(
				rootAccess.expression,
				checker,
			);
			const reportNode =
				rootAccess.kind === SyntaxKind.PropertyAccessExpression
					? rootAccess.name
					: rootAccess.argumentExpression;

			context.report({
				data: {
					type: isIntrinsicErrorType(objectType) ? "`error`" : "`any`",
				},
				message: "unsafeMemberAccess",
				range: getTSNodeRange(reportNode, sourceFile),
			});
		}

		function checkComputedKey(
			node: AST.ElementAccessExpression,
			sourceFile: AST.SourceFile,
			checker: Checker,
		) {
			const keyNode = node.argumentExpression;

			if (
				keyNode.kind === SyntaxKind.StringLiteral ||
				keyNode.kind === SyntaxKind.NumericLiteral ||
				keyNode.kind === SyntaxKind.NoSubstitutionTemplateLiteral
			) {
				return;
			}

			const keyType = getConstrainedTypeAtLocation(keyNode, checker);

			if (keyType.flags & TypeFlags.Any) {
				context.report({
					data: {
						type: isIntrinsicErrorType(keyType) ? "`error`" : "`any`",
					},
					message: "unsafeComputedMemberAccess",
					range: getTSNodeRange(keyNode, sourceFile),
				});
			}
		}

		return {
			visitors: {
				ElementAccessExpression: (node, { sourceFile, checker }) => {
					checkMemberExpression(node, sourceFile, checker);
					checkComputedKey(node, sourceFile, checker);
				},
				PropertyAccessExpression: (node, { sourceFile, checker }) => {
					checkMemberExpression(node, sourceFile, checker);
				},
			},
		};
	},
});

function isIntrinsicErrorType(type: Type): boolean {
	return type.isIntrinsicType() && type.intrinsicName === "error";
}
