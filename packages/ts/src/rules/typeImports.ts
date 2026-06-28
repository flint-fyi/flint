import ts, { SyntaxKind } from "typescript";
import { z } from "zod/v4";

import {
	forEachChild,
	getTSNodeRange,
	typescriptLanguage,
	type AST,
	type Checker,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

interface ImportedSpecifier {
	local: AST.Identifier;
	specifier: ImportSpecifierNode;
	symbol: ts.Symbol | undefined;
}

type ImportSpecifierNode =
	| AST.Identifier
	| AST.ImportSpecifier
	| AST.NamespaceImport;

interface ReportValueImport {
	node: AST.ImportDeclaration;
	typeSpecifiers: ImportSpecifierNode[];
	unusedSpecifiers: ImportSpecifierNode[];
	valueSpecifiers: ImportSpecifierNode[];
}

interface SourceImports {
	reportValueImports: ReportValueImport[];
}

function containsDecorator(node: AST.AnyNode): boolean {
	if (node.kind === SyntaxKind.Decorator) {
		return true;
	}

	return forEachChild(node, containsDecorator) ?? false;
}

function formatWordList(words: string[]) {
	if (words.length < 2) {
		return words[0] ?? "";
	}

	const last = words.at(-1);
	const firstWords = words.slice(0, -1).join(", ");
	return `${firstWords} and ${last}`;
}

function getImportSource(
	node: AST.ImportDeclaration,
	sourceFile: AST.SourceFile,
) {
	return ts.isStringLiteral(node.moduleSpecifier)
		? node.moduleSpecifier.text
		: node.moduleSpecifier.getText(sourceFile);
}

function getImportSpecifiers(node: AST.ImportDeclaration) {
	const importClause = node.importClause;
	if (!importClause) {
		return [];
	}

	const specifiers: ImportSpecifierNode[] = [];

	if (importClause.name) {
		specifiers.push(importClause.name);
	}

	const namedBindings = importClause.namedBindings;
	if (namedBindings) {
		if (namedBindings.kind === ts.SyntaxKind.NamespaceImport) {
			specifiers.push(namedBindings);
		} else {
			specifiers.push(...namedBindings.elements);
		}
	}

	return specifiers;
}

function getReferencedSymbol(typeChecker: Checker, node: AST.Identifier) {
	const symbol = typeChecker.getSymbolAtLocation(node);
	return symbol?.flags && (symbol.flags & ts.SymbolFlags.Alias) !== 0
		? typeChecker.getAliasedSymbol(symbol)
		: symbol;
}

function getSpecifierLocal(specifier: ImportSpecifierNode) {
	return specifier.kind === SyntaxKind.Identifier ? specifier : specifier.name;
}

function getTypeImportFix(
	report: ReportValueImport,
	sourceFile: AST.SourceFile,
	fixStyle: "inline-type-imports" | "separate-type-imports",
) {
	const node = report.node;
	const importText = node.getText(sourceFile);
	const importClause = node.importClause;
	const namedBindings = importClause?.namedBindings;
	const range = getTSNodeRange(node, sourceFile);

	if (report.valueSpecifiers.length || report.unusedSpecifiers.length) {
		if (
			!importClause ||
			importClause.name ||
			namedBindings?.kind !== ts.SyntaxKind.NamedImports
		) {
			return undefined;
		}

		const typeSpecifiers = new Set(report.typeSpecifiers);
		const remainingSpecifiers = namedBindings.elements.filter(
			(specifier) => !typeSpecifiers.has(specifier),
		);
		const typeText = report.typeSpecifiers
			.map((specifier) => specifier.getText(sourceFile))
			.join(", ");
		const remainingText = remainingSpecifiers
			.map((specifier) => specifier.getText(sourceFile))
			.join(", ");
		const moduleText = node.moduleSpecifier.getText(sourceFile);

		return {
			range,
			text: `import type { ${typeText}} from ${moduleText};\nimport { ${remainingText} } from ${moduleText};`,
		};
	}

	if (
		fixStyle === "inline-type-imports" &&
		importClause &&
		!importClause.name &&
		namedBindings?.kind === ts.SyntaxKind.NamedImports
	) {
		const moduleText = node.moduleSpecifier.getText(sourceFile);
		const namedText = namedBindings.elements
			.map((specifier) =>
				specifier.isTypeOnly
					? specifier.getText(sourceFile)
					: `type ${specifier.getText(sourceFile)}`,
			)
			.join(", ");

		return { range, text: `import { ${namedText} } from ${moduleText};` };
	}

	return { range, text: importText.replace(/^import\b/, "import type") };
}

function getTypeKeywordFixRange(node: AST.AnyNode, sourceFile: AST.SourceFile) {
	const range = getTypeKeywordRange(node, sourceFile);
	if (sourceFile.text[range.end] === " ") {
		range.end += 1;
	}

	return range;
}

function getTypeKeywordRange(node: AST.AnyNode, sourceFile: AST.SourceFile) {
	for (const child of node.getChildren(sourceFile)) {
		if (child.kind === SyntaxKind.TypeKeyword) {
			const range = getTSNodeRange(child, sourceFile);
			if (
				node.kind === SyntaxKind.ImportSpecifier &&
				sourceFile.text[range.end] === " "
			) {
				range.end += 1;
			}

			return range;
		}
	}

	return getTSNodeRange(node, sourceFile);
}

function isInImportDeclaration(node: AST.AnyNode) {
	let current: AST.AnyNode | undefined = node;
	while (current) {
		if (current.kind === SyntaxKind.ImportDeclaration) {
			return true;
		}

		// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- removing causes type error on the `while` loop. TSESLint bug?
		current = current.parent as AST.AnyNode | undefined;
	}

	return false;
}

function isInlineTypeSpecifier(specifier: ImportSpecifierNode) {
	return specifier.kind === SyntaxKind.ImportSpecifier && specifier.isTypeOnly;
}

function isOnlyTypeReference(node: AST.Identifier) {
	if (
		isTypeQueryReference(node) ||
		isTypeOnlyExportReference(node) ||
		isPropertySignatureComputedReference(node)
	) {
		return true;
	}

	let current: AST.AnyNode;
	let parent = node.parent as AST.AnyNode | undefined;

	while (parent) {
		if (parent.kind === ts.SyntaxKind.HeritageClause) {
			return parent.token === SyntaxKind.ImplementsKeyword;
		}

		if (
			ts.isTypeAliasDeclaration(parent) ||
			ts.isInterfaceDeclaration(parent) ||
			ts.isTypeParameterDeclaration(parent)
		) {
			return true;
		}

		if (ts.isTypeNode(parent) && !ts.isExpressionWithTypeArguments(parent)) {
			return true;
		}

		current = parent;
		parent = current.parent;
	}

	return false;
}

function isPropertySignatureComputedReference(node: AST.Identifier) {
	let child: AST.AnyNode = node;
	let parent = node.parent as AST.AnyNode | undefined;

	while (parent) {
		switch (parent.kind) {
			case SyntaxKind.PropertySignature:
				return parent.name === child;

			case SyntaxKind.ComputedPropertyName:
				if (parent.expression !== child) {
					return false;
				}
				child = parent;
				parent = parent.parent;
				continue;

			case SyntaxKind.PropertyAccessExpression:
				if ((parent as AST.PropertyAccessExpression).expression !== child) {
					return false;
				}
				child = parent;
				parent = parent.parent;
				continue;

			default:
				return false;
		}
	}

	return false;
}

function isTypeImportDeclaration(node: AST.ImportDeclaration) {
	return node.importClause?.phaseModifier === SyntaxKind.TypeKeyword;
}

function isTypeOnlyExportReference(node: AST.Identifier) {
	const parent = node.parent;
	if (parent.kind !== SyntaxKind.ExportSpecifier) {
		return false;
	}

	const exportDeclaration = parent.parent.parent;
	return parent.name === node && exportDeclaration.isTypeOnly;
}

function isTypeQueryReference(node: AST.Identifier) {
	let child: AST.AnyNode = node;
	let parent = node.parent as AST.AnyNode | undefined;

	while (parent) {
		switch (parent.kind) {
			case SyntaxKind.TypeQuery:
				return true;

			case SyntaxKind.QualifiedName:
				if (parent.left !== child) {
					return false;
				}
				child = parent;
				parent = parent.parent;
				continue;

			default:
				return false;
		}
	}

	return false;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports imports that do not match the configured type import style.",
		id: "typeImports",
		presets: ["stylistic"],
	},
	messages: {
		avoidImportType: {
			primary: "Use a regular import instead of a type-only import.",
			secondary: [
				"This configuration prefers regular imports over `import type` syntax.",
			],
			suggestions: ["Change this type-only import to a regular import."],
		},
		someImportsAreOnlyTypes: {
			primary: "Imports {{ typeImports }} are only used as types.",
			secondary: [
				"These imports are only used in type positions.",
				"Using 'import type' improves tree-shaking and makes intent clear.",
			],
			suggestions: ["Change these imports to use 'import type'."],
		},
		typeOverValue: {
			primary:
				"All imports in this declaration are only used as types. Use 'import type'.",
			secondary: [
				"This import is only used in type positions.",
				"Using 'import type' improves tree-shaking and makes intent clear.",
			],
			suggestions: ["Change this declaration to use 'import type'."],
		},
	},
	options: {
		fixStyle: z
			.enum(["inline-type-imports", "separate-type-imports"])
			.default("inline-type-imports"),
		prefer: z.enum(["no-type-imports", "type-imports"]).default("type-imports"),
	},
	setup(context) {
		return {
			visitors: {
				SourceFile(node, { options, program, sourceFile, typeChecker }) {
					if (options.prefer === "no-type-imports") {
						for (const statement of node.statements) {
							if (
								!ts.isImportDeclaration(statement) ||
								!statement.importClause
							) {
								continue;
							}

							if (isTypeImportDeclaration(statement)) {
								context.report({
									fix: {
										range: getTypeKeywordFixRange(
											statement.importClause,
											sourceFile,
										),
										text: "",
									},
									message: "avoidImportType",
									range: getTypeKeywordRange(
										statement.importClause,
										sourceFile,
									),
								});
								continue;
							}

							for (const specifier of getImportSpecifiers(statement)) {
								if (!isInlineTypeSpecifier(specifier)) {
									continue;
								}

								context.report({
									fix: {
										range: getTypeKeywordFixRange(specifier, sourceFile),
										text: "",
									},
									message: "avoidImportType",
									range: getTypeKeywordRange(specifier, sourceFile),
								});
							}
						}

						return;
					}

					const compilerOptions = program.getCompilerOptions();
					if (
						compilerOptions.experimentalDecorators &&
						compilerOptions.emitDecoratorMetadata &&
						containsDecorator(node)
					) {
						return;
					}

					const sourceImportsMap: Record<string, SourceImports> = {};
					const importedSpecifiers: ImportedSpecifier[] = [];
					const references = new Map<ImportedSpecifier, AST.Identifier[]>();

					for (const statement of node.statements) {
						if (!ts.isImportDeclaration(statement) || !statement.importClause) {
							continue;
						}

						const source = getImportSource(statement, sourceFile);
						sourceImportsMap[source] ??= {
							reportValueImports: [],
						};

						if (isTypeImportDeclaration(statement)) {
							continue;
						}

						for (const specifier of getImportSpecifiers(statement)) {
							if (isInlineTypeSpecifier(specifier)) {
								continue;
							}

							const local = getSpecifierLocal(specifier);
							const importedSpecifier = {
								local,
								specifier,
								symbol: getReferencedSymbol(typeChecker, local),
							};

							importedSpecifiers.push(importedSpecifier);
							references.set(importedSpecifier, []);
						}
					}

					function collectReferences(node: AST.AnyNode) {
						if (ts.isIdentifier(node) && !isInImportDeclaration(node)) {
							const symbol = getReferencedSymbol(typeChecker, node);
							const importedSpecifier = importedSpecifiers.find(
								(specifier) =>
									specifier.local.text === node.text &&
									(!specifier.symbol || specifier.symbol === symbol),
							);

							if (importedSpecifier) {
								references.get(importedSpecifier)?.push(node);
							}
						}

						forEachChild(node, collectReferences);
					}

					collectReferences(node);

					for (const statement of node.statements) {
						if (
							!ts.isImportDeclaration(statement) ||
							!statement.importClause ||
							isTypeImportDeclaration(statement)
						) {
							continue;
						}

						const typeSpecifiers: ImportSpecifierNode[] = [];
						const valueSpecifiers: ImportSpecifierNode[] = [];
						const unusedSpecifiers: ImportSpecifierNode[] = [];

						for (const specifier of getImportSpecifiers(statement)) {
							if (isInlineTypeSpecifier(specifier)) {
								continue;
							}

							const importedSpecifier = importedSpecifiers.find(
								({ specifier: found }) => found === specifier,
							);
							const specifierReferences = importedSpecifier
								? references.get(importedSpecifier)
								: undefined;

							if (!specifierReferences?.length) {
								unusedSpecifiers.push(specifier);
							} else if (specifierReferences.every(isOnlyTypeReference)) {
								typeSpecifiers.push(specifier);
							} else {
								valueSpecifiers.push(specifier);
							}
						}

						if (typeSpecifiers.length) {
							const source = getImportSource(statement, sourceFile);
							const sourceImports = sourceImportsMap[source];
							if (!sourceImports) {
								continue;
							}

							sourceImports.reportValueImports.push({
								node: statement,
								typeSpecifiers,
								unusedSpecifiers,
								valueSpecifiers,
							});
						}
					}

					for (const sourceImports of Object.values(sourceImportsMap)) {
						if (!sourceImports.reportValueImports.length) {
							continue;
						}

						for (const report of sourceImports.reportValueImports) {
							const fix = getTypeImportFix(
								report,
								sourceFile,
								options.fixStyle,
							);

							if (
								!report.valueSpecifiers.length &&
								!report.unusedSpecifiers.length &&
								!report.node.attributes?.elements.length
							) {
								context.report({
									fix,
									message: "typeOverValue",
									range: getTSNodeRange(report.node, sourceFile),
								});
								continue;
							}

							const importNames = report.typeSpecifiers.map(
								(specifier) => `"${getSpecifierLocal(specifier).text}"`,
							);

							context.report({
								data: {
									typeImports: formatWordList(importNames),
								},
								fix,
								message: "someImportsAreOnlyTypes",
								range: getTSNodeRange(report.node, sourceFile),
							});
						}
					}
				},
			},
		};
	},
});
