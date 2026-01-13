import * as tsutils from "ts-api-utils";
import * as ts from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import type { AST, Checker } from "../index.ts";
import { typescriptLanguage } from "../language.ts";
import { getConstrainedTypeAtLocation } from "./utils/getConstrainedType.ts";

export default typescriptLanguage.createRule({
	about: {
		description: "Reports member access on a value with type `any`.",
		id: "anyMemberAccess",
		preset: "logical",
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
			let current: ts.Node | undefined = node.parent;

			while (current) {
				if (ts.isHeritageClause(current)) {
					return true;
				}

				current = current.parent as ts.Node | undefined;
			}

			return false;
		}

		function findRootAnyAccess(
			node: AST.ElementAccessExpression | AST.PropertyAccessExpression,
			typeChecker: Checker,
		): AST.ElementAccessExpression | AST.PropertyAccessExpression | undefined {
			const objectType = getConstrainedTypeAtLocation(
				node.expression,
				typeChecker,
			);

			if (!tsutils.isTypeFlagSet(objectType, ts.TypeFlags.Any)) {
				return undefined;
			}

			if (
				ts.isPropertyAccessExpression(node.expression) ||
				ts.isElementAccessExpression(node.expression)
			) {
				const deeper = findRootAnyAccess(node.expression, typeChecker);
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
				ts.isPropertyAccessExpression(node.expression) ||
				ts.isElementAccessExpression(node.expression)
			) {
				markChainAsReported(node.expression);
			}
		}

		function checkMemberExpression(
			node: AST.ElementAccessExpression | AST.PropertyAccessExpression,
			sourceFile: ts.SourceFile,
			typeChecker: Checker,
		) {
			if (reportedChains.has(node) || isInHeritageClause(node)) {
				return;
			}

			const rootAccess = findRootAnyAccess(node, typeChecker);
			if (!rootAccess) {
				return;
			}

			markChainAsReported(node);

			const objectType = getConstrainedTypeAtLocation(
				rootAccess.expression,
				typeChecker,
			);
			const reportNode =
				rootAccess.kind === ts.SyntaxKind.PropertyAccessExpression
					? rootAccess.name
					: rootAccess.argumentExpression;

			context.report({
				data: {
					type: tsutils.isIntrinsicErrorType(objectType) ? "`error`" : "`any`",
				},
				message: "unsafeMemberAccess",
				range: getTSNodeRange(reportNode, sourceFile),
			});
		}

		function checkComputedKey(
			node: AST.ElementAccessExpression,
			sourceFile: ts.SourceFile,
			typeChecker: Checker,
		) {
			const keyNode = node.argumentExpression;

			if (
				ts.isStringLiteral(keyNode) ||
				ts.isNumericLiteral(keyNode) ||
				ts.isNoSubstitutionTemplateLiteral(keyNode)
			) {
				return;
			}

			const keyType = getConstrainedTypeAtLocation(keyNode, typeChecker);

			if (tsutils.isTypeFlagSet(keyType, ts.TypeFlags.Any)) {
				context.report({
					data: {
						type: tsutils.isIntrinsicErrorType(keyType) ? "`error`" : "`any`",
					},
					message: "unsafeComputedMemberAccess",
					range: getTSNodeRange(keyNode, sourceFile),
				});
			}
		}

		return {
			visitors: {
				ElementAccessExpression: (node, { sourceFile, typeChecker }) => {
					checkMemberExpression(node, sourceFile, typeChecker);
					checkComputedKey(node, sourceFile, typeChecker);
				},
				PropertyAccessExpression: (node, { sourceFile, typeChecker }) => {
					checkMemberExpression(node, sourceFile, typeChecker);
				},
			},
		};
	},
});
