import ts from "typescript";
import { z } from "zod/v4";

import type { CharacterReportRange } from "@flint.fyi/core";
import {
	getTSNodeRange,
	typescriptLanguage,
	unwrapParenthesizedNode,
	type AST,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { countCommentsInRange } from "./utils/countCommentsInRange.ts";

interface RuleOptions {
	enforceForClassMembers: boolean;
}

/**
 * Keys that must stay computed in a given construct, because removing the
 * brackets there would change behavior or produce a syntax error:
 * - `{ ["__proto__"]: value }` defines a property named `"__proto__"`, while
 *   `{ "__proto__": value }` sets the object's prototype.
 * - `class C { ["constructor"]() {} }` defines a method named `"constructor"`,
 *   while `class C { "constructor"() {} }` declares the class constructor.
 * - `class C { ["constructor"]; }` and `class C { static ["constructor"]; }`
 *   define fields named `"constructor"`, while their bracket-less forms are
 *   syntax errors.
 * - `class C { static ["prototype"]() {} }` and `static ["prototype"];` are
 *   runtime errors, while their bracket-less forms are syntax errors.
 */
const exemptKeys = {
	classMember: ["constructor"],
	objectLiteralMember: ["__proto__"],
	staticClassField: ["constructor", "prototype"],
	staticClassMethod: ["prototype"],
};

function createFix(
	range: CharacterReportRange,
	key: string,
	sourceFile: AST.SourceFile,
) {
	// Comments between the brackets would have nowhere to go once the
	// brackets are removed, so only report in that case.
	if (countCommentsInRange(sourceFile.text, range) > 0) {
		return undefined;
	}

	// Without a space, removing the brackets could merge the key into the
	// preceding token: `({ get[2]() {} })` must become `({ get 2() {} })`.
	const needsLeadingSpace =
		isIdentifierLikeCharacter(sourceFile.text[range.begin - 1]) &&
		isIdentifierLikeCharacter(key[0]);

	return {
		range,
		text: needsLeadingSpace ? ` ${key}` : key,
	};
}

function getLiteralKey(name: AST.ComputedPropertyName) {
	const expression = unwrapParenthesizedNode(name.expression);

	return expression.kind === ts.SyntaxKind.StringLiteral ||
		expression.kind === ts.SyntaxKind.NumericLiteral
		? expression
		: undefined;
}

function isIdentifierLikeCharacter(character: string | undefined) {
	return character !== undefined && /[\w$]/u.test(character);
}

function isStaticMember(
	member:
		| AST.GetAccessorDeclaration
		| AST.MethodDeclaration
		| AST.PropertyDeclaration
		| AST.SetAccessorDeclaration,
) {
	return (
		member.modifiers?.some(
			(modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword,
		) ?? false
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports computed property keys that unnecessarily wrap literal strings or numbers.",
		id: "unnecessaryComputedKeys",
		presets: ["stylistic", "stylisticStrict"],
	},
	messages: {
		unnecessaryComputedKey: {
			primary:
				"This computed key is the literal {{ key }}, so its wrapping brackets serve no purpose.",
			secondary: [
				"Computed property keys (`[...]`) allow property names to be derived from dynamic expressions at runtime.",
				"When the expression is a plain string or number literal, the resulting name is fixed ahead of time, so the computed syntax only adds visual noise.",
			],
			suggestions: [
				'Write the literal directly as the key, such as `{ "name": value }` instead of `{ ["name"]: value }`.',
			],
		},
	},
	options: {
		enforceForClassMembers: z
			.boolean()
			.default(true)
			.describe(
				"Whether to also check the keys of class fields, methods, and accessors.",
			),
	},
	setup(context) {
		function checkComputedName(
			name: AST.PropertyName,
			exemptions: readonly string[],
			sourceFile: AST.SourceFile,
		) {
			if (name.kind !== ts.SyntaxKind.ComputedPropertyName) {
				return;
			}

			const literal = getLiteralKey(name);
			if (
				!literal ||
				(literal.kind === ts.SyntaxKind.StringLiteral &&
					exemptions.includes(literal.text))
			) {
				return;
			}

			const key = literal.getText(sourceFile);
			const range = getTSNodeRange(name, sourceFile);

			context.report({
				data: { key },
				fix: createFix(range, key, sourceFile),
				message: "unnecessaryComputedKey",
				range,
			});
		}

		function checkObjectOrClassMember(
			node:
				| AST.GetAccessorDeclaration
				| AST.MethodDeclaration
				| AST.SetAccessorDeclaration,
			{
				options,
				sourceFile,
			}: { options: RuleOptions; sourceFile: AST.SourceFile },
		) {
			if (node.parent.kind === ts.SyntaxKind.ObjectLiteralExpression) {
				checkComputedName(
					node.name,
					exemptKeys.objectLiteralMember,
					sourceFile,
				);
			} else if (
				options.enforceForClassMembers &&
				(node.parent.kind === ts.SyntaxKind.ClassDeclaration ||
					node.parent.kind === ts.SyntaxKind.ClassExpression)
			) {
				checkComputedName(
					node.name,
					isStaticMember(node)
						? exemptKeys.staticClassMethod
						: exemptKeys.classMember,
					sourceFile,
				);
			}
		}

		return {
			visitors: {
				BindingElement: (node, { sourceFile }) => {
					// Destructuring reads a property rather than defining one, so
					// even keys like "__proto__" are safe to write without brackets.
					if (node.propertyName) {
						checkComputedName(node.propertyName, [], sourceFile);
					}
				},
				GetAccessor: checkObjectOrClassMember,
				MethodDeclaration: checkObjectOrClassMember,
				PropertyAssignment: (node, { sourceFile }) => {
					checkComputedName(
						node.name,
						exemptKeys.objectLiteralMember,
						sourceFile,
					);
				},
				PropertyDeclaration: (node, { options, sourceFile }) => {
					if (options.enforceForClassMembers) {
						checkComputedName(
							node.name,
							isStaticMember(node)
								? exemptKeys.staticClassField
								: exemptKeys.classMember,
							sourceFile,
						);
					}
				},
				SetAccessor: checkObjectOrClassMember,
			},
		};
	},
});
