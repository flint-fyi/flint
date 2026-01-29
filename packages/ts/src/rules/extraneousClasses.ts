import {
	type AST,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";
import { z } from "zod";

import { ruleCreator } from "./ruleCreator.ts";

type ClassMemberWithModifiers =
	| AST.GetAccessorDeclaration
	| AST.MethodDeclaration
	| AST.PropertyDeclaration
	| AST.SetAccessorDeclaration;

function hasDecorators(
	node: AST.ClassDeclaration | AST.ClassExpression,
): boolean {
	return node.modifiers?.some(ts.isDecorator) ?? false;
}

function hasParameterProperties(
	constructor: AST.ConstructorDeclaration,
): boolean {
	return constructor.parameters.some((parameter) =>
		parameter.modifiers?.some(
			(modifier) =>
				modifier.kind === ts.SyntaxKind.PublicKeyword ||
				modifier.kind === ts.SyntaxKind.PrivateKeyword ||
				modifier.kind === ts.SyntaxKind.ProtectedKeyword ||
				modifier.kind === ts.SyntaxKind.ReadonlyKeyword,
		),
	);
}

function hasStaticModifier(
	modifiers: ts.NodeArray<AST.ModifierLike> | undefined,
): boolean {
	return (
		modifiers?.some(
			(modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword,
		) ?? false
	);
}

function hasSuperClass(
	node: AST.ClassDeclaration | AST.ClassExpression,
): boolean {
	return (
		node.heritageClauses?.some(
			(clause) => clause.token === ts.SyntaxKind.ExtendsKeyword,
		) ?? false
	);
}

function isRealMember(
	member: AST.ClassElement,
): member is ClassMemberWithModifiers {
	return (
		!ts.isConstructorDeclaration(member) &&
		!ts.isClassStaticBlockDeclaration(member) &&
		!ts.isSemicolonClassElement(member)
	);
}

const options = {
	allowConstructorOnly: z
		.boolean()
		.default(false)
		.describe(
			"Whether to allow extraneous classes that contain only a constructor.",
		),
	allowEmpty: z
		.boolean()
		.default(false)
		.describe(
			"Whether to allow extraneous classes that have no body (are empty).",
		),
	allowStaticOnly: z
		.boolean()
		.default(false)
		.describe(
			"Whether to allow extraneous classes that only contain static members.",
		),
	allowWithDecorator: z
		.boolean()
		.default(false)
		.describe("Whether to allow extraneous classes that include a decorator."),
};

type Options = z.infer<z.ZodObject<typeof options>>;

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports classes used as static namespaces.",
		id: "extraneousClasses",
		presets: ["logicalStrict"],
	},
	messages: {
		empty: {
			primary: "This empty class does nothing and can be removed.",
			secondary: [
				"Empty classes serve no purpose and add unnecessary noise to the codebase.",
			],
			suggestions: [
				"Remove the empty class.",
				"Add members if you intended the class to have functionality.",
			],
		},
		onlyConstructor: {
			primary:
				"This class contains only a constructor and can be removed or replaced with a standalone function.",
			secondary: [
				"Classes with only a constructor and no fields can be replaced with a standalone function.",
			],
			suggestions: [
				"Replace the class with a standalone function.",
				"Add instance properties or methods if the class needs state.",
			],
		},
		onlyStatic: {
			primary:
				"This class contains only static properties and can be removed or replaced with variables.",
			secondary: [
				"Static-only classes can be replaced with plain objects or module exports.",
				"Using a class as a namespace adds unnecessary complexity.",
			],
			suggestions: [
				"Convert static methods to standalone exported functions.",
				"Use 'export * as namespace' to group exports if needed.",
			],
		},
	},
	options,
	setup(context) {
		function checkClass(
			node: AST.ClassDeclaration | AST.ClassExpression,
			{
				options,
				sourceFile,
			}: TypeScriptFileServices & {
				options: Options;
			},
		) {
			if (hasSuperClass(node)) {
				return;
			}

			if (options.allowWithDecorator && hasDecorators(node)) {
				return;
			}

			const realMembers = node.members.filter(isRealMember);

			const reportRange = node.name
				? { begin: node.name.getStart(sourceFile), end: node.name.getEnd() }
				: { begin: node.getStart(sourceFile), end: node.getEnd() };

			if (realMembers.length === 0) {
				for (const member of node.members) {
					if (
						ts.isConstructorDeclaration(member) &&
						hasParameterProperties(member)
					) {
						return;
					}
				}

				const hasConstructor = node.members.some(ts.isConstructorDeclaration);

				if (hasConstructor) {
					if (!options.allowConstructorOnly) {
						context.report({
							message: "onlyConstructor",
							range: reportRange,
						});
					}
				} else if (!options.allowEmpty) {
					context.report({
						message: "empty",
						range: reportRange,
					});
				}
				return;
			}

			let onlyStatic = true;
			let onlyConstructor = true;

			for (const member of node.members) {
				if (ts.isConstructorDeclaration(member)) {
					if (hasParameterProperties(member)) {
						onlyConstructor = false;
						onlyStatic = false;
					}
				} else if (isRealMember(member)) {
					onlyConstructor = false;
					if (!hasStaticModifier(member.modifiers)) {
						onlyStatic = false;
					}
				}

				if (!onlyConstructor && !onlyStatic) {
					break;
				}
			}

			if (onlyConstructor) {
				if (!options.allowConstructorOnly) {
					context.report({
						message: "onlyConstructor",
						range: reportRange,
					});
				}
				return;
			}

			if (onlyStatic && !options.allowStaticOnly) {
				context.report({
					message: "onlyStatic",
					range: reportRange,
				});
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
