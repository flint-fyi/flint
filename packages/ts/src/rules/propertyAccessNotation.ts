import ts from "typescript";
import { z } from "zod/v4";

import {
	getStaticPropertyName,
	getTSNodeRange,
	typescriptLanguage,
	type AST,
	type Checker,
} from "@flint.fyi/typescript-language";

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
				"Prefer the cleaner dot notation instead of bracket notation for `{{ key }}`.",
			secondary: [
				"Dot notation is more concise and easier to read.",
				"Bracket notation should only be used when the property name is not a valid identifier or is a reserved word.",
			],
			suggestions: ['Replace `["{{ key }}"]` with `.{{ key }}`.'],
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
			key: string,
			typeChecker: Checker,
		) {
			const propertySymbol =
				typeChecker.getSymbolAtLocation(node.argumentExpression) ??
				typeChecker
					.getTypeAtLocation(node.expression)
					.getNonNullableType()
					.getProperties()
					.find(
						(propertySymbol) => (propertySymbol.escapedName as string) === key,
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
					const key = getStaticPropertyName(node);
					if (!key || keyCannotBeUsedWithDotNotation(key)) {
						return;
					}

					const { inaccessible, propertySymbol } = getKeyTypeInformation(
						node,
						key,
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
