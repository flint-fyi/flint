import ts, { SyntaxKind } from "typescript";
import { z } from "zod/v4";

import { typescriptLanguage, type AST } from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

type ClassMember =
	| AST.GetAccessorDeclaration
	| AST.MethodDeclaration
	| AST.PropertyDeclaration
	| AST.SetAccessorDeclaration;

interface RuleOptions {
	ignoreClassesThatImplementAnInterface: "public-fields" | boolean;
	ignoreOverrideMethods: boolean;
}

function classImplementsSomething(
	classNode: AST.ClassDeclaration | AST.ClassExpression,
): boolean {
	return (
		classNode.heritageClauses?.some(
			(clause) => clause.token === SyntaxKind.ImplementsKeyword,
		) ?? false
	);
}

function containsThis(node: ts.Node): boolean {
	switch (node.kind) {
		case SyntaxKind.ClassDeclaration:
		case SyntaxKind.ClassExpression: {
			const classNode = node as ts.ClassDeclaration | ts.ClassExpression;
			for (const member of classNode.members) {
				if (
					ts.isPropertyDeclaration(member) &&
					ts.isComputedPropertyName(member.name) &&
					containsThis(member.name.expression)
				) {
					return true;
				}
			}
			return false;
		}

		case SyntaxKind.ClassStaticBlockDeclaration:
		case SyntaxKind.FunctionDeclaration:
		case SyntaxKind.FunctionExpression:
			return false;

		case SyntaxKind.SuperKeyword:
		case SyntaxKind.ThisKeyword:
			return true;

		default:
			return ts.forEachChild(node, containsThis) ?? false;
	}
}

// TODO: Use a util like getStaticValue
// https://github.com/flint-fyi/flint/issues/1298
function getMemberDisplayName(
	member: ClassMember,
	sourceFile: AST.SourceFile,
): string | undefined {
	const name = member.name;

	if (
		name.kind === SyntaxKind.Identifier ||
		name.kind === SyntaxKind.StringLiteral ||
		name.kind === SyntaxKind.NumericLiteral
	) {
		return name.text;
	}

	if (name.kind === SyntaxKind.PrivateIdentifier) {
		return name.text;
	}

	if (name.kind === SyntaxKind.ComputedPropertyName) {
		const expr = name.expression;
		if (
			expr.kind === SyntaxKind.StringLiteral ||
			expr.kind === SyntaxKind.NoSubstitutionTemplateLiteral ||
			expr.kind === SyntaxKind.NumericLiteral
		) {
			return expr.text;
		}

		return `[${expr.getText(sourceFile)}]`;
	}

	return undefined;
}

function hasModifier(
	modifiers: ts.NodeArray<AST.ModifierLike> | undefined,
	kind: SyntaxKind,
): boolean {
	return modifiers?.some((modifier) => modifier.kind === kind) ?? false;
}

function isPublicMember(member: ClassMember): boolean {
	if (member.name.kind === SyntaxKind.PrivateIdentifier) {
		return false;
	}

	const modifiers = member.modifiers;
	if (!modifiers) {
		return true;
	}

	if (
		modifiers.some(
			(m) =>
				m.kind === SyntaxKind.PrivateKeyword ||
				m.kind === SyntaxKind.ProtectedKeyword,
		)
	) {
		return false;
	}

	return true;
}

function shouldSkipMember(
	member: ClassMember,
	classNode: AST.ClassDeclaration | AST.ClassExpression,
	options: RuleOptions,
): boolean {
	if (hasModifier(member.modifiers, SyntaxKind.StaticKeyword)) {
		return true;
	}

	if (
		options.ignoreOverrideMethods &&
		hasModifier(member.modifiers, SyntaxKind.OverrideKeyword)
	) {
		return true;
	}

	const implementsInterface = classImplementsSomething(classNode);
	const ignoreImpl = options.ignoreClassesThatImplementAnInterface;

	if (implementsInterface && ignoreImpl) {
		if (ignoreImpl === true) {
			return true;
		}

		if (isPublicMember(member)) {
			return true;
		}
	}

	return false;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports class methods that do not use `this`.",
		id: "classMethodsThis",
		presets: ["stylistic", "stylisticStrict"],
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
	options: {
		ignoreClassesThatImplementAnInterface: z
			.union([z.boolean(), z.literal("public-fields")])
			.default(false)
			.describe(
				"Whether to ignore classes that implement interfaces. Set to 'public-fields' to only ignore public members.",
			),
		ignoreOverrideMethods: z
			.boolean()
			.default(false)
			.describe("Whether to ignore members with the 'override' modifier."),
	},
	setup(context) {
		function reportMember(
			member: ClassMember,
			kind: string,
			sourceFile: AST.SourceFile,
			reportFromStart: boolean,
		) {
			const name = getMemberDisplayName(member, sourceFile);
			if (!name) {
				return;
			}

			const beginNode = reportFromStart ? member : member.name;

			context.report({
				data: { kind, name },
				message: "missingThis",
				range: {
					begin: beginNode.getStart(sourceFile),
					end: member.name.getEnd(),
				},
			});
		}

		function checkMethod(
			member: AST.MethodDeclaration,
			classNode: AST.ClassDeclaration | AST.ClassExpression,
			sourceFile: AST.SourceFile,
			options: RuleOptions,
		) {
			if (
				member.body &&
				!shouldSkipMember(member, classNode, options) &&
				!containsThis(member.body)
			) {
				reportMember(member, "method", sourceFile, false);
			}
		}

		function checkAccessor(
			member: AST.GetAccessorDeclaration | AST.SetAccessorDeclaration,
			classNode: AST.ClassDeclaration | AST.ClassExpression,
			sourceFile: AST.SourceFile,
			options: RuleOptions,
			kind: "getter" | "setter",
		) {
			if (
				member.body &&
				!shouldSkipMember(member, classNode, options) &&
				!containsThis(member.body)
			) {
				reportMember(member, kind, sourceFile, true);
			}
		}

		function checkPropertyInitializerFunction(
			member: AST.PropertyDeclaration,
			classNode: AST.ClassDeclaration | AST.ClassExpression,
			sourceFile: AST.SourceFile,
			options: RuleOptions,
		) {
			if (!member.initializer) {
				return;
			}

			if (
				member.initializer.kind !== SyntaxKind.ArrowFunction &&
				member.initializer.kind !== SyntaxKind.FunctionExpression
			) {
				return;
			}

			if (
				!shouldSkipMember(member, classNode, options) &&
				!containsThis(member.initializer.body)
			) {
				reportMember(member, "method", sourceFile, false);
			}
		}

		function checkClass(
			node: AST.ClassDeclaration | AST.ClassExpression,
			{
				options,
				sourceFile,
			}: { options: RuleOptions; sourceFile: AST.SourceFile },
		) {
			for (const member of node.members) {
				switch (member.kind) {
					case SyntaxKind.GetAccessor:
						checkAccessor(member, node, sourceFile, options, "getter");
						break;
					case SyntaxKind.MethodDeclaration:
						checkMethod(member, node, sourceFile, options);
						break;
					case SyntaxKind.PropertyDeclaration:
						checkPropertyInitializerFunction(member, node, sourceFile, options);
						break;
					case SyntaxKind.SetAccessor:
						checkAccessor(member, node, sourceFile, options, "setter");
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
