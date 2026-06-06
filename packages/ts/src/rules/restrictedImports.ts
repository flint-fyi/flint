import ts, { SyntaxKind } from "typescript";
import { z } from "zod/v4";

import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { getSpecifierNames } from "../type-utils/getSpecifierNames.ts";
import { matchesSpecifier } from "../type-utils/matchesSpecifier.ts";
import { typeOrValueSpecifierSchema } from "../type-utils/schemas.ts";
import { ruleCreator } from "./ruleCreator.ts";

const restrictionSchema = z.object({
	allowTypeImports: z
		.boolean()
		.optional()
		.describe("Whether type-only imports are exempt from the restriction."),
	message: z
		.string()
		.optional()
		.describe("A custom message to display when the restriction is triggered."),
	specifier: typeOrValueSpecifierSchema.describe(
		"A TypeOrValueSpecifier identifying the restricted import.",
	),
});

type Restriction = z.infer<typeof restrictionSchema>;

function resolveModuleDeclarations(
	moduleSpecifier: ts.Expression,
	typeChecker: ts.TypeChecker,
) {
	const symbol = typeChecker.getSymbolAtLocation(moduleSpecifier);
	return symbol?.getDeclarations();
}

function resolveSymbolDeclarations(
	nameNode: ts.Node,
	typeChecker: ts.TypeChecker,
) {
	let symbol = typeChecker.getSymbolAtLocation(nameNode);
	if (!symbol) {
		return undefined;
	}

	if (symbol.flags & ts.SymbolFlags.Alias) {
		symbol = typeChecker.getAliasedSymbol(symbol);
	}

	return symbol.getDeclarations();
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Restricts specified modules from being imported.",
		id: "restrictedImports",
	},
	messages: {
		moduleRestricted: {
			primary: "'{{ source }}' import is restricted.",
			secondary: ["This module has been restricted by project configuration."],
			suggestions: [
				"Remove this import or replace it with an allowed alternative.",
			],
		},
		moduleRestrictedWithMessage: {
			primary: "'{{ source }}' import is restricted. {{ customMessage }}",
			secondary: ["This module has been restricted by project configuration."],
			suggestions: [
				"Remove this import or replace it with an allowed alternative.",
			],
		},
		namespaceRestricted: {
			primary:
				"* import is invalid because '{{ restrictedNames }}' from '{{ source }}' is restricted.",
			secondary: [
				"This import uses a namespace or wildcard import, but specific names from this module are restricted.",
			],
			suggestions: [
				"Replace the namespace import with named imports that are allowed.",
			],
		},
		namespaceRestrictedWithMessage: {
			primary:
				"* import is invalid because '{{ restrictedNames }}' from '{{ source }}' is restricted. {{ customMessage }}",
			secondary: [
				"This import uses a namespace or wildcard import, but specific names from this module are restricted.",
			],
			suggestions: [
				"Replace the namespace import with named imports that are allowed.",
			],
		},
		restricted: {
			primary: "'{{ importName }}' import from '{{ source }}' is restricted.",
			secondary: [
				"This import name has been restricted by project configuration.",
			],
			suggestions: [
				"Remove this import or replace it with an allowed alternative.",
			],
		},
		restrictedWithMessage: {
			primary:
				"'{{ importName }}' import from '{{ source }}' is restricted. {{ customMessage }}",
			secondary: [
				"This import name has been restricted by project configuration.",
			],
			suggestions: [
				"Remove this import or replace it with an allowed alternative.",
			],
		},
	},
	options: {
		restrictions: z
			.array(restrictionSchema)
			.default([])
			.describe(
				"Restrictions on imports, using TypeOrValueSpecifier to identify targets.",
			),
	},
	setup(context) {
		function checkNamedRestrictions(
			restrictions: Restriction[],
			declarations: ts.Declaration[],
			importedName: string,
			isTypeOnly: boolean,
			source: string,
			range: ReturnType<typeof getTSNodeRange>,
			program: ts.Program,
		) {
			for (const restriction of restrictions) {
				if (restriction.allowTypeImports && isTypeOnly) {
					continue;
				}

				if (
					matchesSpecifier(
						importedName,
						declarations,
						restriction.specifier,
						program,
					)
				) {
					context.report({
						data: {
							customMessage: restriction.message ?? "",
							importName: importedName,
							source,
						},
						message: restriction.message
							? "restrictedWithMessage"
							: "restricted",
						range,
					});
				}
			}
		}

		function checkWildcardRestrictions(
			restrictions: Restriction[],
			moduleDeclarations: ts.Declaration[],
			source: string,
			topLevelTypeOnly: boolean,
			range: ReturnType<typeof getTSNodeRange>,
			program: ts.Program,
		) {
			for (const restriction of restrictions) {
				if (restriction.allowTypeImports && topLevelTypeOnly) {
					continue;
				}

				const names = getSpecifierNames(restriction.specifier);
				if (names !== undefined) {
					if (
						matchesSpecifier(
							undefined,
							moduleDeclarations,
							{
								...restriction.specifier,
								name: undefined,
							},
							program,
						)
					) {
						context.report({
							data: {
								customMessage: restriction.message ?? "",
								restrictedNames: names.join("', '"),
								source,
							},
							message: restriction.message
								? "namespaceRestrictedWithMessage"
								: "namespaceRestricted",
							range,
						});
					}
				} else if (
					matchesSpecifier(
						undefined,
						moduleDeclarations,
						restriction.specifier,
						program,
					)
				) {
					context.report({
						data: {
							customMessage: restriction.message ?? "",
							source,
						},
						message: restriction.message
							? "moduleRestrictedWithMessage"
							: "moduleRestricted",
						range,
					});
				}
			}
		}

		return {
			visitors: {
				ExportDeclaration: (
					node,
					{ options, program, sourceFile, typeChecker },
				) => {
					if (
						!node.moduleSpecifier ||
						!ts.isStringLiteral(node.moduleSpecifier)
					) {
						return;
					}

					const source = node.moduleSpecifier.text;
					const topLevelTypeOnly = node.isTypeOnly;
					const range = getTSNodeRange(node, sourceFile);

					if (node.exportClause && ts.isNamedExports(node.exportClause)) {
						for (const element of node.exportClause.elements) {
							const isTypeOnly = topLevelTypeOnly || element.isTypeOnly;
							const importedName = element.propertyName
								? element.propertyName.text
								: element.name.text;
							const declarations = resolveSymbolDeclarations(
								element.name,
								typeChecker,
							);
							if (!declarations?.length) {
								continue;
							}

							checkNamedRestrictions(
								options.restrictions,
								declarations,
								importedName,
								isTypeOnly,
								source,
								range,
								program,
							);
						}
					} else {
						const moduleDeclarations = resolveModuleDeclarations(
							node.moduleSpecifier,
							typeChecker,
						);
						if (!moduleDeclarations?.length) {
							return;
						}

						checkWildcardRestrictions(
							options.restrictions,
							moduleDeclarations,
							source,
							topLevelTypeOnly,
							range,
							program,
						);
					}
				},
				ImportDeclaration: (
					node,
					{ options, program, sourceFile, typeChecker },
				) => {
					if (!ts.isStringLiteral(node.moduleSpecifier)) {
						return;
					}

					const source = node.moduleSpecifier.text;
					const range = getTSNodeRange(node, sourceFile);

					if (!node.importClause) {
						const moduleDeclarations = resolveModuleDeclarations(
							node.moduleSpecifier,
							typeChecker,
						);
						if (!moduleDeclarations?.length) {
							return;
						}

						for (const restriction of options.restrictions) {
							if (
								matchesSpecifier(
									undefined,
									moduleDeclarations,
									restriction.specifier,
									program,
								)
							) {
								context.report({
									data: {
										customMessage: restriction.message ?? "",
										source,
									},
									message: restriction.message
										? "moduleRestrictedWithMessage"
										: "moduleRestricted",
									range,
								});
							}
						}

						return;
					}

					const topLevelTypeOnly =
						node.importClause.phaseModifier === SyntaxKind.TypeKeyword;

					if (node.importClause.name) {
						const declarations = resolveSymbolDeclarations(
							node.importClause.name,
							typeChecker,
						);
						if (declarations?.length) {
							checkNamedRestrictions(
								options.restrictions,
								declarations,
								"default",
								topLevelTypeOnly,
								source,
								range,
								program,
							);
						}
					}

					const bindings = node.importClause.namedBindings;
					if (!bindings) {
						return;
					}

					if (ts.isNamedImports(bindings)) {
						for (const element of bindings.elements) {
							const isTypeOnly = topLevelTypeOnly || element.isTypeOnly;
							const importedName = element.propertyName
								? element.propertyName.text
								: element.name.text;
							const declarations = resolveSymbolDeclarations(
								element.name,
								typeChecker,
							);
							if (!declarations?.length) {
								continue;
							}

							checkNamedRestrictions(
								options.restrictions,
								declarations,
								importedName,
								isTypeOnly,
								source,
								range,
								program,
							);
						}

						return;
					}

					const moduleDeclarations = resolveModuleDeclarations(
						node.moduleSpecifier,
						typeChecker,
					);
					if (!moduleDeclarations?.length) {
						return;
					}

					checkWildcardRestrictions(
						options.restrictions,
						moduleDeclarations,
						source,
						topLevelTypeOnly,
						range,
						program,
					);
				},
			},
		};
	},
});
