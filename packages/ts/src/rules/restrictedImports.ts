import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts, { SyntaxKind } from "typescript";
import { z } from "zod";

import { ruleCreator } from "./ruleCreator.ts";

const pathConfigSchema = z.object({
	allowImportNames: z
		.array(z.string())
		.optional()
		.describe("Import names that are explicitly allowed from this module."),
	allowTypeImports: z
		.boolean()
		.optional()
		.describe("Whether type-only imports from this module are allowed."),
	importNames: z
		.array(z.string())
		.optional()
		.describe("Specific import names to restrict from this module."),
	message: z
		.string()
		.optional()
		.describe("A custom message to display when this module is restricted."),
	name: z.string().describe("The module specifier to restrict."),
});

const patternConfigSchema = z.object({
	allowImportNames: z
		.array(z.string())
		.optional()
		.describe(
			"Import names that are explicitly allowed from matching modules.",
		),
	allowTypeImports: z
		.boolean()
		.optional()
		.describe("Whether type-only imports from matching modules are allowed."),
	group: z
		.array(z.string())
		.describe("Glob patterns to match module specifiers against."),
	importNames: z
		.array(z.string())
		.optional()
		.describe("Specific import names to restrict from matching modules."),
	message: z
		.string()
		.optional()
		.describe(
			"A custom message to display when a matching module is restricted.",
		),
});

interface ImportedName {
	isTypeOnly: boolean;
	name: string;
}

interface NormalizedPathConfig {
	allowImportNames?: string[] | undefined;
	allowTypeImports?: boolean | undefined;
	importNames?: string[] | undefined;
	message?: string | undefined;
}

interface NormalizedPatternConfig {
	allowImportNames?: string[] | undefined;
	allowTypeImports?: boolean | undefined;
	group: RegExp[];
	importNames?: string[] | undefined;
	message?: string | undefined;
}

function globToRegExp(pattern: string) {
	const escaped = pattern
		.replace(/[.+^${}()|[\]\\]/g, "\\$&")
		.replace(/\*\*/g, "\0")
		.replace(/\*/g, "[^/]*")
		.replace(/\?/g, "[^/]")
		.replace(/\0/g, ".*");
	return new RegExp(`^${escaped}$`);
}

function hasNameRestrictions(config: {
	allowImportNames?: string[] | undefined;
	importNames?: string[] | undefined;
}) {
	return Boolean(config.importNames ?? config.allowImportNames);
}

function isNameRestricted(
	name: string,
	config: {
		allowImportNames?: string[] | undefined;
		importNames?: string[] | undefined;
	},
) {
	if (config.importNames) {
		return config.importNames.includes(name);
	}

	if (config.allowImportNames) {
		return !config.allowImportNames.includes(name);
	}

	return true;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Restricts specified modules from being imported.",
		id: "restrictedImports",
	},
	messages: {
		everythingRestricted: {
			primary:
				"* import is invalid because '{{ importNames }}' from '{{ source }}' is restricted.",
			secondary: [
				"This import uses a namespace or wildcard import, but specific names from this module are restricted.",
				"Consider importing only the allowed names explicitly.",
			],
			suggestions: [
				"Replace the namespace import with named imports that are allowed.",
			],
		},
		everythingRestrictedWithMessage: {
			primary:
				"* import is invalid because '{{ importNames }}' from '{{ source }}' is restricted. {{ customMessage }}",
			secondary: [
				"This import uses a namespace or wildcard import, but specific names from this module are restricted.",
			],
			suggestions: [
				"Replace the namespace import with named imports that are allowed.",
			],
		},
		importNameRestricted: {
			primary: "'{{ importName }}' import from '{{ source }}' is restricted.",
			secondary: [
				"This specific import name has been restricted by project configuration.",
				"Consider using an alternative API or module.",
			],
			suggestions: [
				"Remove this import or replace it with an allowed alternative.",
			],
		},
		importNameRestrictedWithMessage: {
			primary:
				"'{{ importName }}' import from '{{ source }}' is restricted. {{ customMessage }}",
			secondary: [
				"This specific import name has been restricted by project configuration.",
			],
			suggestions: [
				"Remove this import or replace it with an allowed alternative.",
			],
		},
		pathRestricted: {
			primary: "'{{ source }}' import is restricted from being used.",
			secondary: [
				"This module has been restricted by project configuration.",
				"Consider using an alternative module.",
			],
			suggestions: [
				"Remove this import or replace it with an allowed alternative.",
			],
		},
		pathRestrictedWithMessage: {
			primary:
				"'{{ source }}' import is restricted from being used. {{ customMessage }}",
			secondary: ["This module has been restricted by project configuration."],
			suggestions: [
				"Remove this import or replace it with an allowed alternative.",
			],
		},
		patternRestricted: {
			primary:
				"'{{ source }}' import is restricted from being used by a pattern.",
			secondary: [
				"This module matches a restricted pattern in the project configuration.",
				"Consider using an alternative module.",
			],
			suggestions: [
				"Remove this import or replace it with an allowed alternative.",
			],
		},
		patternRestrictedWithMessage: {
			primary:
				"'{{ source }}' import is restricted from being used by a pattern. {{ customMessage }}",
			secondary: [
				"This module matches a restricted pattern in the project configuration.",
			],
			suggestions: [
				"Remove this import or replace it with an allowed alternative.",
			],
		},
	},
	options: {
		paths: z
			.array(z.union([z.string(), pathConfigSchema]))
			.default([])
			.describe("Exact module specifiers to restrict."),
		patterns: z
			.array(z.union([z.string(), patternConfigSchema]))
			.default([])
			.describe("Glob patterns to match restricted module specifiers."),
	},
	setup(context) {
		const state = {
			initialized: false,
			normalizedPatterns: [] as NormalizedPatternConfig[],
			pathMap: new Map<string, NormalizedPathConfig[]>(),
		};

		function ensureInitialized(options: unknown) {
			if (state.initialized) {
				return;
			}

			state.initialized = true;

			const { paths, patterns } = options as {
				paths: (
					| string
					| {
							allowImportNames?: string[] | undefined;
							allowTypeImports?: boolean | undefined;
							importNames?: string[] | undefined;
							message?: string | undefined;
							name: string;
					  }
				)[];
				patterns: (
					| string
					| {
							allowImportNames?: string[] | undefined;
							allowTypeImports?: boolean | undefined;
							group: string[];
							importNames?: string[] | undefined;
							message?: string | undefined;
					  }
				)[];
			};

			for (const pathEntry of paths) {
				if (typeof pathEntry === "string") {
					const existing = state.pathMap.get(pathEntry) ?? [];
					existing.push({});
					state.pathMap.set(pathEntry, existing);
				} else {
					const existing = state.pathMap.get(pathEntry.name) ?? [];
					existing.push({
						allowImportNames: pathEntry.allowImportNames,
						allowTypeImports: pathEntry.allowTypeImports,
						importNames: pathEntry.importNames,
						message: pathEntry.message,
					});
					state.pathMap.set(pathEntry.name, existing);
				}
			}

			for (const patternEntry of patterns) {
				if (typeof patternEntry === "string") {
					state.normalizedPatterns.push({
						group: [globToRegExp(patternEntry)],
					});
				} else {
					state.normalizedPatterns.push({
						allowImportNames: patternEntry.allowImportNames,
						allowTypeImports: patternEntry.allowTypeImports,
						group: patternEntry.group.map(globToRegExp),
						importNames: patternEntry.importNames,
						message: patternEntry.message,
					});
				}
			}
		}

		function checkNode(
			source: string,
			names: ImportedName[],
			range: { begin: number; end: number },
		) {
			const pathConfigs = state.pathMap.get(source);
			if (pathConfigs) {
				for (const config of pathConfigs) {
					if (config.allowTypeImports && names.every((n) => n.isTypeOnly)) {
						continue;
					}

					if (!hasNameRestrictions(config)) {
						context.report({
							data: {
								customMessage: config.message ?? "",
								source,
							},
							message: config.message
								? "pathRestrictedWithMessage"
								: "pathRestricted",
							range,
						});
						continue;
					}

					for (const imported of names) {
						if (config.allowTypeImports && imported.isTypeOnly) {
							continue;
						}

						if (imported.name === "*") {
							context.report({
								data: {
									customMessage: config.message ?? "",
									importNames: config.importNames?.join("', '") ?? "",
									source,
								},
								message: config.message
									? "everythingRestrictedWithMessage"
									: "everythingRestricted",
								range,
							});
							continue;
						}

						if (isNameRestricted(imported.name, config)) {
							context.report({
								data: {
									customMessage: config.message ?? "",
									importName: imported.name,
									source,
								},
								message: config.message
									? "importNameRestrictedWithMessage"
									: "importNameRestricted",
								range,
							});
						}
					}
				}
			}

			for (const pattern of state.normalizedPatterns) {
				const matches = pattern.group.some((re) => re.test(source));
				if (!matches) {
					continue;
				}

				if (pattern.allowTypeImports && names.every((n) => n.isTypeOnly)) {
					continue;
				}

				if (!hasNameRestrictions(pattern)) {
					context.report({
						data: {
							customMessage: pattern.message ?? "",
							source,
						},
						message: pattern.message
							? "patternRestrictedWithMessage"
							: "patternRestricted",
						range,
					});
					continue;
				}

				for (const imported of names) {
					if (pattern.allowTypeImports && imported.isTypeOnly) {
						continue;
					}

					if (imported.name === "*") {
						context.report({
							data: {
								customMessage: pattern.message ?? "",
								importNames: pattern.importNames?.join("', '") ?? "",
								source,
							},
							message: pattern.message
								? "everythingRestrictedWithMessage"
								: "everythingRestricted",
							range,
						});
						continue;
					}

					if (isNameRestricted(imported.name, pattern)) {
						context.report({
							data: {
								customMessage: pattern.message ?? "",
								importName: imported.name,
								source,
							},
							message: pattern.message
								? "importNameRestrictedWithMessage"
								: "importNameRestricted",
							range,
						});
					}
				}
			}
		}

		function reportSideEffectRestrictions(
			source: string,
			range: { begin: number; end: number },
		) {
			const pathConfigs = state.pathMap.get(source);
			if (pathConfigs) {
				for (const config of pathConfigs) {
					if (!hasNameRestrictions(config)) {
						context.report({
							data: {
								customMessage: config.message ?? "",
								source,
							},
							message: config.message
								? "pathRestrictedWithMessage"
								: "pathRestricted",
							range,
						});
					}
				}
			}

			for (const pattern of state.normalizedPatterns) {
				const matches = pattern.group.some((re) => re.test(source));
				if (matches && !hasNameRestrictions(pattern)) {
					context.report({
						data: {
							customMessage: pattern.message ?? "",
							source,
						},
						message: pattern.message
							? "patternRestrictedWithMessage"
							: "patternRestricted",
						range,
					});
				}
			}
		}

		return {
			visitors: {
				ExportDeclaration: (node, { options, sourceFile }) => {
					if (
						!node.moduleSpecifier ||
						!ts.isStringLiteral(node.moduleSpecifier)
					) {
						return;
					}

					ensureInitialized(options);

					const source = node.moduleSpecifier.text;
					const topLevelTypeOnly = node.isTypeOnly;
					const range = getTSNodeRange(node, sourceFile);

					let names: ImportedName[];
					if (node.exportClause && ts.isNamedExports(node.exportClause)) {
						names = node.exportClause.elements.map((element) => ({
							isTypeOnly: topLevelTypeOnly || element.isTypeOnly,
							name: element.propertyName
								? element.propertyName.text
								: element.name.text,
						}));
					} else {
						names = [{ isTypeOnly: topLevelTypeOnly, name: "*" }];
					}

					checkNode(source, names, range);
				},
				ImportDeclaration: (node, { options, sourceFile }) => {
					if (!ts.isStringLiteral(node.moduleSpecifier)) {
						return;
					}

					ensureInitialized(options);

					const source = node.moduleSpecifier.text;
					const range = getTSNodeRange(node, sourceFile);

					// Side-effect import: import "mod"
					if (!node.importClause) {
						reportSideEffectRestrictions(source, range);
						return;
					}

					const topLevelTypeOnly =
						node.importClause.phaseModifier === SyntaxKind.TypeKeyword;
					const names: ImportedName[] = [];

					if (node.importClause.name) {
						names.push({
							isTypeOnly: topLevelTypeOnly,
							name: "default",
						});
					}

					const bindings = node.importClause.namedBindings;
					if (bindings) {
						if (ts.isNamedImports(bindings)) {
							for (const element of bindings.elements) {
								names.push({
									isTypeOnly: topLevelTypeOnly || element.isTypeOnly,
									name: element.propertyName
										? element.propertyName.text
										: element.name.text,
								});
							}
						} else {
							names.push({
								isTypeOnly: topLevelTypeOnly,
								name: "*",
							});
						}
					}

					checkNode(source, names, range);
				},
			},
		};
	},
});
