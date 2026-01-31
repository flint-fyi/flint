import {
	type AST,
	type Checker,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";
import { z } from "zod";

import { ruleCreator } from "./ruleCreator.ts";

const javascriptReservedWords = new Set([
	"await",
	"break",
	"case",
	"catch",
	"class",
	"const",
	"continue",
	"debugger",
	"default",
	"delete",
	"do",
	"else",
	"enum",
	"export",
	"extends",
	"false",
	"finally",
	"for",
	"function",
	"if",
	"implements",
	"import",
	"in",
	"instanceof",
	"interface",
	"let",
	"new",
	"null",
	"package",
	"private",
	"protected",
	"public",
	"return",
	"static",
	"super",
	"switch",
	"this",
	"throw",
	"true",
	"try",
	"typeof",
	"var",
	"void",
	"while",
	"with",
	"yield",
]);

function getModifiers(node: null | ts.Node | undefined) {
	return node && ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
}

// TODO: Use a util like getStaticValue
// https://github.com/flint-fyi/flint/issues/1298
function getPropertyKeyText(node: AST.ElementAccessExpression) {
	switch (node.argumentExpression.kind) {
		case ts.SyntaxKind.FalseKeyword:
			return "false";
		case ts.SyntaxKind.NullKeyword:
			return "null";
		case ts.SyntaxKind.StringLiteral:
			return node.argumentExpression.text;
		case ts.SyntaxKind.TrueKeyword:
			return "true";
		default:
			return undefined;
	}
}

function keyCannotBeUsedWithDotNotation(key: string) {
	return (
		!/^[\p{L}_$][\p{L}\d_$]*$/u.test(key) || javascriptReservedWords.has(key)
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports bracket notation property access when dot notation can be used.",
		id: "propertyAccessNotation",
		presets: ["stylistic", "stylisticStrict"],
	},
	messages: {
		preferDotNotation: {
			primary:
				"Prefer the cleaner dot notation instead of bracket notation for `{{key}}`.",
			secondary: [
				"Dot notation is more concise and easier to read.",
				"Bracket notation should only be used when the property name is not a valid identifier or is a reserved word.",
			],
			suggestions: ['Replace `["{{key}}"]` with `.{{key}}`.'],
		},
	},
	options: {
		allowIndexSignaturePropertyAccess: z
			.boolean()
			.default(false)
			.describe(
				"Whether to allow accessing properties matching an index signature with bracket notation.",
			),
	},
	setup(context) {
		function getKeyTypeInformation(
			node: AST.ElementAccessExpression,
			typeChecker: Checker,
		) {
			const propertySymbol =
				typeChecker.getSymbolAtLocation(node.argumentExpression) ??
				typeChecker
					.getTypeAtLocation(node.expression)
					.getNonNullableType()
					.getProperties()
					.find(
						(propertySymbol) =>
							ts.isStringLiteral(node.argumentExpression) &&
							(propertySymbol.escapedName as string) ===
								node.argumentExpression.text,
					);

			const modifierKind = getModifiers(
				propertySymbol?.getDeclarations()?.[0],
			)?.[0]?.kind;

			return {
				inaccessible:
					modifierKind === ts.SyntaxKind.PrivateKeyword ||
					modifierKind === ts.SyntaxKind.ProtectedKeyword,
				propertySymbol,
			};
		}
		return {
			visitors: {
				ElementAccessExpression: (
					node,
					{ options, sourceFile, typeChecker },
				) => {
					const key = getPropertyKeyText(node);
					if (!key || keyCannotBeUsedWithDotNotation(key)) {
						return;
					}

					const { inaccessible, propertySymbol } = getKeyTypeInformation(
						node,
						typeChecker,
					);
					if (inaccessible) {
						return;
					}

					if (options.allowIndexSignaturePropertyAccess && !propertySymbol) {
						const objectType = typeChecker
							.getTypeAtLocation(node.expression)
							.getNonNullableType();
						if (
							typeChecker
								.getIndexInfosOfType(objectType)
								.some((info) => info.keyType.flags & ts.TypeFlags.StringLike)
						) {
							return;
						}
					}

					const objectText = node.expression.getText(sourceFile);
					const isOptionalChain = node.questionDotToken !== undefined;
					const dotOperator = isOptionalChain ? "?." : ".";

					context.report({
						data: { key },
						fix: {
							range: getTSNodeRange(node, sourceFile),
							text: `${objectText}${dotOperator}${key}`,
						},
						message: "preferDotNotation",
						range: {
							begin: node.argumentExpression.getStart(sourceFile),
							end: node.argumentExpression.getEnd(),
						},
					});
				},
			},
		};
	},
});
