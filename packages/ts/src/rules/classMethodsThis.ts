import ts from "typescript";

import type { AST } from "../index.ts";
import { typescriptLanguage } from "../language.ts";
import { ruleCreator } from "./ruleCreator.ts";

type ClassMember =
	| AST.GetAccessorDeclaration
	| AST.MethodDeclaration
	| AST.PropertyDeclaration
	| AST.SetAccessorDeclaration;

function classImplementsInterface(
	classNode: AST.ClassDeclaration | AST.ClassExpression,
) {
	return classNode.heritageClauses?.some(
		(clause) => clause.token === ts.SyntaxKind.ImplementsKeyword,
	);
}

function containsThis(node: ts.Node): boolean {
	if (
		node.kind === ts.SyntaxKind.ThisKeyword ||
		node.kind === ts.SyntaxKind.SuperKeyword
	) {
		return true;
	}

	if (
		node.kind === ts.SyntaxKind.ClassDeclaration ||
		node.kind === ts.SyntaxKind.ClassExpression ||
		node.kind === ts.SyntaxKind.FunctionDeclaration ||
		node.kind === ts.SyntaxKind.FunctionExpression
	) {
		return false;
	}

	return ts.forEachChild(node, containsThis) ?? false;
}

function getMemberName(
	member: ClassMember,
	sourceFile: ts.SourceFile,
): string | undefined {
	if (
		ts.isIdentifier(member.name) ||
		ts.isStringLiteral(member.name) ||
		ts.isNumericLiteral(member.name)
	) {
		return member.name.text;
	}

	if (ts.isPrivateIdentifier(member.name)) {
		return member.name.text;
	}

	if (ts.isComputedPropertyName(member.name)) {
		return `[${member.name.expression.getText(sourceFile)}]`;
	}

	return undefined;
}

function hasModifier(
	modifiers: ts.NodeArray<AST.ModifierLike> | undefined,
	kind: ts.SyntaxKind,
) {
	return modifiers?.some((modifier) => modifier.kind === kind) ?? false;
}

function isOverrideMember(member: ClassMember) {
	return hasModifier(member.modifiers, ts.SyntaxKind.OverrideKeyword);
}

function isStaticMember(member: ClassMember) {
	return hasModifier(member.modifiers, ts.SyntaxKind.StaticKeyword);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports class methods that do not use `this`.",
		id: "classMethodsThis",
		presets: ["stylistic"],
	},
	messages: {
		missingThis: {
			primary: "Expected 'this' to be used by class {{ kind }} '{{ name }}'.",
			secondary: [
				"Methods that don't use `this` could be static methods or standalone functions.",
				"Using instance methods that don't access instance state can be misleading.",
			],
			suggestions: [
				"Add the `static` keyword to make this a static method.",
				"Extract this to a standalone function if it doesn't need class context.",
			],
		},
	},
	setup(context) {
		function shouldSkipMember(
			member: ClassMember,
			classNode: AST.ClassDeclaration | AST.ClassExpression,
		) {
			return (
				isStaticMember(member) ||
				isOverrideMember(member) ||
				(classImplementsInterface(classNode) ?? false)
			);
		}

		function reportMember(
			member: ClassMember,
			kind: string,
			sourceFile: ts.SourceFile,
			reportFromStart: boolean,
		) {
			const name = getMemberName(member, sourceFile) ?? "(anonymous)";
			const begin = reportFromStart
				? member.getStart(sourceFile)
				: member.name.getStart(sourceFile);

			context.report({
				data: {
					kind,
					name,
				},
				message: "missingThis",
				range: {
					begin,
					end: member.name.getEnd(),
				},
			});
		}

		function checkMethod(
			member: AST.MethodDeclaration,
			classNode: AST.ClassDeclaration | AST.ClassExpression,
			sourceFile: ts.SourceFile,
		) {
			if (shouldSkipMember(member, classNode) || !member.body) {
				return;
			}

			if (containsThis(member.body)) {
				return;
			}

			reportMember(member, "method", sourceFile, false);
		}

		function checkAccessor(
			member: AST.GetAccessorDeclaration | AST.SetAccessorDeclaration,
			classNode: AST.ClassDeclaration | AST.ClassExpression,
			sourceFile: ts.SourceFile,
			kind: "getter" | "setter",
		) {
			if (shouldSkipMember(member, classNode) || !member.body) {
				return;
			}

			if (containsThis(member.body)) {
				return;
			}

			reportMember(member, kind, sourceFile, true);
		}

		function checkPropertyArrowFunction(
			member: AST.PropertyDeclaration,
			classNode: AST.ClassDeclaration | AST.ClassExpression,
			sourceFile: ts.SourceFile,
		) {
			if (shouldSkipMember(member, classNode)) {
				return;
			}

			if (
				!member.initializer ||
				member.initializer.kind !== ts.SyntaxKind.ArrowFunction
			) {
				return;
			}

			const arrowFunction = member.initializer;

			if (containsThis(arrowFunction.body)) {
				return;
			}

			reportMember(member, "method", sourceFile, false);
		}

		function checkClass(
			node: AST.ClassDeclaration | AST.ClassExpression,
			{ sourceFile }: { sourceFile: ts.SourceFile },
		) {
			for (const member of node.members) {
				switch (member.kind) {
					case ts.SyntaxKind.GetAccessor:
						checkAccessor(member, node, sourceFile, "getter");
						break;
					case ts.SyntaxKind.MethodDeclaration:
						checkMethod(member, node, sourceFile);
						break;
					case ts.SyntaxKind.PropertyDeclaration:
						checkPropertyArrowFunction(member, node, sourceFile);
						break;
					case ts.SyntaxKind.SetAccessor:
						checkAccessor(member, node, sourceFile, "setter");
						break;
				}
			}
		}

		return {
			visitors: {
				ClassDeclaration: checkClass,
				ClassExpression: checkClass,
			},
		};
	},
});
