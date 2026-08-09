import ts, {
	NodeFlags,
	SymbolFlags,
	SyntaxKind,
	type Symbol as TypeScriptSymbol,
} from "typescript";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
	type Checker,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

type StarKind = "bare" | "namespace";
type SymbolKind = "type" | "value" | undefined;

function classifySymbol(
	symbol: TypeScriptSymbol | undefined,
	typeChecker: Checker,
	seen = new Set<TypeScriptSymbol>(),
): SymbolKind {
	if (!symbol || typeChecker.isUnknownSymbol(symbol) || seen.has(symbol)) {
		return undefined;
	}

	seen.add(symbol);
	if (symbol.flags & SymbolFlags.Value) {
		return "value";
	}

	if (
		symbol.declarations?.some((declaration) =>
			ts.isTypeOnlyImportOrExportDeclaration(declaration),
		)
	) {
		return "type";
	}

	if (symbol.flags & SymbolFlags.Alias) {
		return classifySymbol(
			typeChecker.getImmediateAliasedSymbol(symbol),
			typeChecker,
			seen,
		);
	}

	return "type";
}

function formatWordList(words: string[]) {
	if (words.length < 2) {
		return words.join("");
	}

	return `${words.slice(0, -1).join(", ")} and ${words.at(-1)}`;
}

function getTypeKeywordRange(
	specifier: AST.ExportSpecifier,
	sourceFile: AST.SourceFile,
) {
	const begin = specifier.getStart(sourceFile);
	const end = begin + "type".length;
	return {
		begin,
		end: end + (sourceFile.text[end] === " " ? 1 : 0),
	};
}

function hasUnresolvedStarExport(
	symbol: TypeScriptSymbol,
	typeChecker: Checker,
	seen = new Set<TypeScriptSymbol>(),
) {
	if (seen.has(symbol)) {
		return false;
	}

	seen.add(symbol);
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Resolved module symbols always have declarations.
	for (const declaration of symbol.getDeclarations()!) {
		for (const statement of declaration.getSourceFile().statements) {
			if (!ts.isExportDeclaration(statement)) {
				continue;
			}

			const nestedSymbol = statement.moduleSpecifier
				? typeChecker.getSymbolAtLocation(statement.moduleSpecifier)
				: undefined;
			if (statement.isTypeOnly || statement.exportClause) {
				continue;
			}

			if (
				!nestedSymbol ||
				typeChecker.isUnknownSymbol(nestedSymbol) ||
				hasUnresolvedStarExport(nestedSymbol, typeChecker, seen)
			) {
				return true;
			}
		}
	}

	return false;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports exports of types that do not use type-only export syntax.",
		id: "typeExports",
		presets: ["stylistic"],
	},
	messages: {
		allTypes: {
			primary: "All exports in this declaration are types. Use `export type`.",
			secondary: ["Type-only exports are erased from emitted JavaScript."],
			suggestions: ["Add the `type` modifier to this export declaration."],
		},
		mixedTypes: {
			primary:
				"Exports {{ names }} are types. Use inline `type` modifiers for them.",
			secondary: [
				"Inline modifiers distinguish erased exports from runtime exports.",
			],
			suggestions: ["Add inline `type` modifiers to the type exports."],
		},
		starTypes: {
			primary: "This module exports only types. Use `export type`.",
			secondary: ["Type-only star exports are erased from emitted JavaScript."],
			suggestions: ["Add the `type` modifier to this star export."],
		},
	},
	setup(context) {
		const bareModuleKinds = new Map<
			TypeScriptSymbol,
			Exclude<SymbolKind, undefined>
		>();
		const namespaceModuleKinds = new Map<
			TypeScriptSymbol,
			Exclude<SymbolKind, undefined>
		>();

		function classifyModule(
			symbol: TypeScriptSymbol | undefined,
			typeChecker: Checker,
			starKind: StarKind,
		) {
			if (!symbol || typeChecker.isUnknownSymbol(symbol)) {
				return undefined;
			}

			const moduleKinds =
				starKind === "bare" ? bareModuleKinds : namespaceModuleKinds;
			const cached = moduleKinds.get(symbol);
			if (cached !== undefined) {
				return cached;
			}

			if (hasUnresolvedStarExport(symbol, typeChecker)) {
				return undefined;
			}

			const exports = typeChecker
				.getExportsOfModule(symbol)
				.filter(
					(exported) => starKind === "namespace" || exported.name !== "default",
				);
			if (!exports.length) {
				return undefined;
			}

			const moduleType = typeChecker.getTypeOfSymbol(symbol);
			const kind = typeChecker
				.getPropertiesOfType(moduleType)
				.some(
					(property) =>
						(starKind === "namespace" || property.name !== "default") &&
						typeChecker.getPropertyOfType(moduleType, property.name) !==
							undefined,
				)
				? "value"
				: "type";
			moduleKinds.set(symbol, kind);
			return kind;
		}

		return {
			visitors: {
				ExportDeclaration: (node, { sourceFile, typeChecker }) => {
					if (sourceFile.flags & NodeFlags.JavaScriptFile || node.isTypeOnly) {
						return;
					}

					const range = getTSNodeRange(node, sourceFile);
					const exportKeywordEnd = node.getStart(sourceFile) + "export".length;
					const moduleSymbol = node.moduleSpecifier
						? typeChecker.getSymbolAtLocation(node.moduleSpecifier)
						: undefined;
					if (node.exportClause?.kind === SyntaxKind.NamedExports) {
						const typeSpecifiers = node.exportClause.elements.filter(
							(specifier) =>
								!specifier.isTypeOnly &&
								classifySymbol(
									typeChecker.getSymbolAtLocation(specifier.name),
									typeChecker,
								) === "type",
						);
						if (!typeSpecifiers.length) {
							return;
						}

						const allTypes = node.exportClause.elements.every(
							(specifier) =>
								specifier.isTypeOnly || typeSpecifiers.includes(specifier),
						);
						if (allTypes) {
							const inlineRanges = node.exportClause.elements
								.filter((specifier) => specifier.isTypeOnly)
								.map((specifier) => getTypeKeywordRange(specifier, sourceFile));
							context.report({
								fix: !node.attributes
									? [
											{
												range: {
													begin: exportKeywordEnd,
													end: exportKeywordEnd,
												},
												text: " type",
											},
											...inlineRanges.map((inlineRange) => ({
												range: inlineRange,
												text: "",
											})),
										]
									: undefined,
								message: "allTypes",
								range,
							});
							return;
						}

						context.report({
							data: {
								names: formatWordList(
									typeSpecifiers.map((specifier) => `“${specifier.name.text}”`),
								),
							},
							fix: typeSpecifiers.map((specifier) => {
								const start = specifier.getStart(sourceFile);
								return { range: { begin: start, end: start }, text: "type " };
							}),
							message: "mixedTypes",
							range,
						});
						return;
					}

					if (
						classifyModule(
							moduleSymbol,
							typeChecker,
							node.exportClause ? "namespace" : "bare",
						) === "type"
					) {
						context.report({
							fix: !node.attributes
								? {
										range: {
											begin: exportKeywordEnd,
											end: exportKeywordEnd,
										},
										text: " type",
									}
								: undefined,
							message: "starTypes",
							range,
						});
					}
				},
			},
		};
	},
});
