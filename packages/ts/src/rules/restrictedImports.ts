import {
	declarationIncludesGlobal,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import path from "node:path";
import ts, { SyntaxKind } from "typescript";
import { z } from "zod/v4";

import { ruleCreator } from "./ruleCreator.ts";

const fileSpecifierSchema = z.object({
	from: z.literal("file"),
	name: z.union([z.string(), z.array(z.string())]).optional(),
	path: z.string().optional(),
});

const libSpecifierSchema = z.object({
	from: z.literal("lib"),
	name: z.union([z.string(), z.array(z.string())]).optional(),
});

const packageSpecifierSchema = z.object({
	from: z.literal("package"),
	name: z.union([z.string(), z.array(z.string())]).optional(),
	package: z.string(),
});

const typeOrValueSpecifierSchema = z.union([
	fileSpecifierSchema,
	libSpecifierSchema,
	packageSpecifierSchema,
]);

type TypeOrValueSpecifier = z.infer<typeof typeOrValueSpecifierSchema>;

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

function getSpecifierNames(
	specifier: TypeOrValueSpecifier,
): string[] | undefined {
	if (specifier.name === undefined) {
		return undefined;
	}

	return Array.isArray(specifier.name) ? specifier.name : [specifier.name];
}

function isFromFile(
	declarationFileName: string,
	specifiedPath: string | undefined,
	program: ts.Program,
): boolean {
	if (specifiedPath === undefined) {
		return (
			!declarationFileName.includes("/node_modules/") &&
			!/\/lib\.[^/]*\.d\.ts$/.test(declarationFileName)
		);
	}

	const absolutePath = path.resolve(
		program.getCurrentDirectory(),
		specifiedPath,
	);
	return (
		normalizePath(declarationFileName) === normalizePath(absolutePath) ||
		normalizePath(declarationFileName) ===
			normalizePath(absolutePath.replace(/\.ts$/, ""))
	);
}

function isFromPackage(fileName: string, packageName: string): boolean {
	if (fileName.includes(`/node_modules/${packageName}/`)) {
		return true;
	}

	if (!packageName.startsWith("@")) {
		if (fileName.includes(`/node_modules/@types/${packageName}/`)) {
			return true;
		}
	} else {
		const normalized = packageName.replace("@", "").replace("/", "__");
		if (fileName.includes(`/node_modules/@types/${normalized}/`)) {
			return true;
		}
	}

	return false;
}

function matchesSpecifier(
	importedName: string | undefined,
	declarations: ts.Declaration[],
	specifier: TypeOrValueSpecifier,
	program: ts.Program,
): boolean {
	const names = getSpecifierNames(specifier);
	if (
		names !== undefined &&
		(importedName === undefined || !names.includes(importedName))
	) {
		return false;
	}

	return declarations.some((declaration) => {
		const fileName = declaration.getSourceFile().fileName;
		switch (specifier.from) {
			case "file":
				return isFromFile(fileName, specifier.path, program);
			case "lib":
				return declarationIncludesGlobal(declaration);
			case "package":
				return isFromPackage(fileName, specifier.package);
		}
	});
}

function normalizePath(filePath: string): string {
	return filePath
		.replace(/\\/g, "/")
		.replace(/\/index\.(?:ts|js|tsx|jsx)$/, "");
}

function resolveModuleDeclarations(
	moduleSpecifier: ts.Expression,
	typeChecker: ts.TypeChecker,
): ts.Declaration[] | undefined {
	const symbol = typeChecker.getSymbolAtLocation(moduleSpecifier);
	return symbol?.getDeclarations();
}

function resolveSymbolDeclarations(
	nameNode: ts.Node,
	typeChecker: ts.TypeChecker,
): ts.Declaration[] | undefined {
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

					const { restrictions } = options as {
						restrictions: Restriction[];
					};
					if (!restrictions.length) {
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
					} else {
						// export * from "mod"
						const moduleDeclarations = resolveModuleDeclarations(
							node.moduleSpecifier,
							typeChecker,
						);
						if (!moduleDeclarations?.length) {
							return;
						}

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
										} as TypeOrValueSpecifier,
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
				},
				ImportDeclaration: (
					node,
					{ options, program, sourceFile, typeChecker },
				) => {
					if (!ts.isStringLiteral(node.moduleSpecifier)) {
						return;
					}

					const { restrictions } = options as {
						restrictions: Restriction[];
					};
					if (!restrictions.length) {
						return;
					}

					const source = node.moduleSpecifier.text;
					const range = getTSNodeRange(node, sourceFile);

					// Side-effect import: import "mod"
					if (!node.importClause) {
						const moduleDeclarations = resolveModuleDeclarations(
							node.moduleSpecifier,
							typeChecker,
						);
						if (!moduleDeclarations?.length) {
							return;
						}

						for (const restriction of restrictions) {
							if (getSpecifierNames(restriction.specifier)) {
								continue;
							}

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

					// Default import: import foo from "mod"
					if (node.importClause.name) {
						const declarations = resolveSymbolDeclarations(
							node.importClause.name,
							typeChecker,
						);
						if (declarations?.length) {
							for (const restriction of restrictions) {
								if (restriction.allowTypeImports && topLevelTypeOnly) {
									continue;
								}

								if (
									matchesSpecifier(
										"default",
										declarations,
										restriction.specifier,
										program,
									)
								) {
									context.report({
										data: {
											customMessage: restriction.message ?? "",
											importName: "default",
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
					}

					const bindings = node.importClause.namedBindings;
					if (!bindings) {
						return;
					}

					// Named imports: import { a, b } from "mod"
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

						return;
					}

					// Namespace import: import * as ns from "mod"
					const moduleDeclarations = resolveModuleDeclarations(
						node.moduleSpecifier,
						typeChecker,
					);
					if (!moduleDeclarations?.length) {
						return;
					}

					for (const restriction of restrictions) {
						if (restriction.allowTypeImports && topLevelTypeOnly) {
							continue;
						}

						const names = getSpecifierNames(restriction.specifier);
						if (names !== undefined) {
							// Name-specific restriction on a namespace import
							if (
								matchesSpecifier(
									undefined,
									moduleDeclarations,
									{
										...restriction.specifier,
										name: undefined,
									} as TypeOrValueSpecifier,
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
				},
			},
		};
	},
});
