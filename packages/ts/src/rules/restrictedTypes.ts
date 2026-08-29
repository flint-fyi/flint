import ts from "typescript";
import { z } from "zod/v4";

import {
	getTSNodeRange,
	typescriptLanguage,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

import { matchesSpecifier } from "../type-utils/matchesSpecifier.ts";
import { typeOrValueSpecifierSchema } from "../type-utils/schemas.ts";
import { ruleCreator } from "./ruleCreator.ts";

const restrictionSchema = z.object({
	message: z
		.string()
		.optional()
		.describe("A custom message to display when the restriction is triggered."),
	specifier: typeOrValueSpecifierSchema.describe(
		"A TypeOrValueSpecifier identifying the restricted declaration.",
	),
});

interface Options {
	restrictions: z.infer<typeof restrictionSchema>[];
}

interface VisitorServices extends TypeScriptFileServices {
	options: Options;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Disallows references to specified types and values in type positions.",
		id: "restrictedTypes",
	},
	messages: {
		restricted: {
			primary:
				"Type reference '{{ source }}' resolves to a restricted declaration.",
			secondary: [
				"Restrictions match the final declaration identity rather than the local spelling.",
			],
			suggestions: ["Use an allowed type instead."],
		},
		restrictedWithMessage: {
			primary:
				"Type reference '{{ source }}' resolves to a restricted declaration. {{ customMessage }}",
			secondary: [
				"Restrictions match the final declaration identity rather than the local spelling.",
			],
			suggestions: ["Use an allowed type instead."],
		},
	},
	options: {
		restrictions: z
			.array(restrictionSchema)
			.default([])
			.describe("Declarations that are restricted in type positions."),
	},
	setup(context) {
		return {
			visitors: {
				ExpressionWithTypeArguments: (node, services) => {
					checkNode(node.expression, services);
				},
				ImportType: (node, services) => {
					if (node.qualifier) {
						checkNode(node.qualifier, services);
					} else {
						checkNode(
							ts.isLiteralTypeNode(node.argument)
								? node.argument.literal
								: node.argument,
							services,
							node,
							true,
						);
					}
				},
				TypeQuery: (node, services) => {
					checkNode(node.exprName, services);
				},
				TypeReference: (node, services) => {
					checkNode(node.typeName, services);
				},
			},
		};

		function checkNode(
			symbolNode: ts.Node,
			{ options, program, sourceFile, typeChecker }: VisitorServices,
			reportNode: ts.Node = symbolNode,
			omitName = false,
		) {
			if (!options.restrictions.length) {
				return;
			}

			let symbol = typeChecker.getSymbolAtLocation(symbolNode);
			if (!symbol) {
				return;
			}

			if (symbol.flags & ts.SymbolFlags.Alias) {
				symbol = typeChecker.getAliasedSymbol(symbol);
			}

			symbol = typeChecker.getMergedSymbol(symbol);
			const declarations = symbol.getDeclarations();
			if (!declarations?.length) {
				return;
			}

			const name = omitName ? undefined : symbol.getName();
			for (const restriction of options.restrictions) {
				if (
					!matchesSpecifier(name, declarations, restriction.specifier, program)
				) {
					continue;
				}

				context.report({
					data: {
						customMessage: restriction.message ?? "",
						source: reportNode.getText(sourceFile),
					},
					message: restriction.message ? "restrictedWithMessage" : "restricted",
					range: getTSNodeRange(reportNode, sourceFile),
				});
				return;
			}
		}
	},
});
