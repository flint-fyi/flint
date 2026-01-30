import {
	type AST,
	getTSNodeRange,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function hasDecorators(node: AST.ClassDeclaration | AST.ClassExpression) {
	return node.modifiers?.some(ts.isDecorator) ?? false;
}

function hasExtendsClause(node: AST.ClassDeclaration | AST.ClassExpression) {
	return (
		node.heritageClauses?.some(
			(clause) => clause.token === ts.SyntaxKind.ExtendsKeyword,
		) ?? false
	);
}

function hasPrivateConstructor(node: AST.ConstructorDeclaration) {
	return (
		node.modifiers?.some(
			(modifier) => modifier.kind === ts.SyntaxKind.PrivateKeyword,
		) ?? false
	);
}

function hasStaticModifier(
	modifiers: ts.NodeArray<AST.ModifierLike> | undefined,
) {
	return (
		modifiers?.some(
			(modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword,
		) ?? false
	);
}

function isAbstractClass(node: AST.ClassDeclaration | AST.ClassExpression) {
	return (
		node.modifiers?.some(
			(modifier) => modifier.kind === ts.SyntaxKind.AbstractKeyword,
		) ?? false
	);
}

function isEmptyConstructor(member: AST.ConstructorDeclaration) {
	return !member.body?.statements.length && !member.parameters.length;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports classes that only contain static members.",
		id: "staticMemberOnlyClasses",
		presets: ["logicalStrict"],
	},
	messages: {
		noStaticOnlyClass: {
			primary:
				"This class only contains static members. Consider using module-level exports instead.",
			secondary: [
				"Classes with only static members add unnecessary complexity.",
				"Module-level functions and constants are simpler and more idiomatic in JavaScript/TypeScript.",
			],
			suggestions: [
				"Use module-level functions and constants instead of a static-only class.",
				"If grouping is needed, use a plain object or namespace.",
			],
		},
	},
	setup(context) {
		function checkClass(
			node: AST.ClassDeclaration | AST.ClassExpression,
			{ sourceFile }: TypeScriptFileServices,
		) {
			if (
				hasExtendsClause(node) ||
				isAbstractClass(node) ||
				hasDecorators(node) ||
				!node.members.length
			) {
				return;
			}

			let hasNonStaticMember = false;
			let hasPrivateConstructorMember = false;

			for (const member of node.members) {
				if (ts.isConstructorDeclaration(member)) {
					if (hasPrivateConstructor(member)) {
						hasPrivateConstructorMember = true;
						break;
					}
					if (!isEmptyConstructor(member)) {
						hasNonStaticMember = true;
						break;
					}
					continue;
				}

				if (
					ts.isSemicolonClassElement(member) ||
					ts.isClassStaticBlockDeclaration(member)
				) {
					continue;
				}

				if (ts.isIndexSignatureDeclaration(member)) {
					hasNonStaticMember = true;
					break;
				}

				if (
					(ts.isPropertyDeclaration(member) ||
						ts.isMethodDeclaration(member) ||
						ts.isGetAccessorDeclaration(member) ||
						ts.isSetAccessorDeclaration(member)) &&
					!hasStaticModifier(member.modifiers)
				) {
					hasNonStaticMember = true;
					break;
				}
			}

			if (hasPrivateConstructorMember || hasNonStaticMember) {
				return;
			}

			const reportRange = getTSNodeRange(node.name ?? node, sourceFile);

			context.report({
				message: "noStaticOnlyClass",
				range: reportRange,
			});
		}

		return {
			visitors: {
				ClassDeclaration: checkClass,
				ClassExpression: checkClass,
			},
		};
	},
});
