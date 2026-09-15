import ts, { SyntaxKind } from "typescript";

import {
	typescriptLanguage,
	type AST,
	type Checker,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { countCommentsInRange } from "./utils/countCommentsInRange.ts";

type ActiveDeclaration =
	| AST.EnumDeclaration
	| AST.ModuleDeclaration
	| AST.NamespaceDeclaration;
type NamespaceAccess = AST.PropertyAccessExpression | AST.QualifiedName;

function getNamespaceAccessParts(node: NamespaceAccess) {
	if (node.kind === SyntaxKind.QualifiedName) {
		return { member: node.right, qualifier: node.left };
	}

	if (
		node.questionDotToken ||
		node.name.kind !== SyntaxKind.Identifier ||
		!isEntityNameExpression(node.expression)
	) {
		return undefined;
	}

	return { member: node.name, qualifier: node.expression };
}

function isEntityNameExpression(node: AST.Expression): boolean {
	return (
		node.kind === SyntaxKind.Identifier ||
		(node.kind === SyntaxKind.PropertyAccessExpression &&
			node.questionDotToken === undefined &&
			node.name.kind === SyntaxKind.Identifier &&
			isEntityNameExpression(node.expression))
	);
}

function symbolDeclaresActiveNamespace(
	symbol: ts.Symbol,
	activeDeclarations: ActiveDeclaration[],
	typeChecker: Checker,
) {
	if (
		symbol
			.getDeclarations()
			?.some((declaration) =>
				activeDeclarations.includes(declaration as ActiveDeclaration),
			)
	) {
		return true;
	}

	if (!(symbol.flags & ts.SymbolFlags.Alias)) {
		return false;
	}

	return symbolDeclaresActiveNamespace(
		typeChecker.getAliasedSymbol(symbol),
		activeDeclarations,
		typeChecker,
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports unnecessary namespace and enum qualifiers.",
		id: "unnecessaryQualifiers",
		presets: ["stylistic"],
	},
	messages: {
		unnecessaryQualifier: {
			primary:
				"This qualifier is unnecessary because the unqualified name is already in scope and resolves to the same namespace or enum member.",
			secondary: [],
			suggestions: ["Remove the unnecessary qualifier."],
		},
	},
	setup(context) {
		const activeDeclarations: ActiveDeclaration[] = [];
		const moduleDeclarationCounts: number[] = [];
		let reportedNamespaceAccess: NamespaceAccess | undefined;

		function checkNamespaceAccess(
			node: NamespaceAccess,
			{
				sourceFile,
				typeChecker,
			}: { sourceFile: AST.SourceFile; typeChecker: Checker },
		) {
			if (reportedNamespaceAccess || !activeDeclarations.length) {
				return;
			}

			const parts = getNamespaceAccessParts(node);
			if (!parts) {
				return;
			}

			const qualifierSymbol = typeChecker.getSymbolAtLocation(parts.qualifier);
			if (
				!qualifierSymbol ||
				!symbolDeclaresActiveNamespace(
					qualifierSymbol,
					activeDeclarations,
					typeChecker,
				)
			) {
				return;
			}

			const accessedSymbol = typeChecker.getSymbolAtLocation(parts.member);
			if (!accessedSymbol) {
				return;
			}

			const inScopeSymbol = typeChecker
				.getSymbolsInScope(parts.qualifier, accessedSymbol.flags)
				.find((symbol) => symbol.name === accessedSymbol.name);
			if (
				!inScopeSymbol ||
				accessedSymbol !== typeChecker.getExportSymbolOfSymbol(inScopeSymbol)
			) {
				return;
			}

			const qualifierRange = {
				begin: parts.qualifier.getStart(sourceFile),
				end: parts.qualifier.end,
			};
			const removalRange = {
				begin: qualifierRange.begin,
				end: parts.member.getStart(sourceFile),
			};
			reportedNamespaceAccess = node;
			context.report({
				fix:
					countCommentsInRange(sourceFile.text, removalRange) === 0
						? { range: removalRange, text: "" }
						: undefined,
				message: "unnecessaryQualifier",
				range: qualifierRange,
			});
		}

		function exitNamespaceAccess(node: NamespaceAccess) {
			if (reportedNamespaceAccess === node) {
				reportedNamespaceAccess = undefined;
			}
		}

		return {
			visitors: {
				EnumDeclaration: (node) => activeDeclarations.push(node),
				"EnumDeclaration:exit": () => activeDeclarations.pop(),
				ModuleBlock(node) {
					let parent = node.parent;
					let count = 0;
					while (parent.kind === SyntaxKind.ModuleDeclaration) {
						activeDeclarations.push(parent);
						count++;
						parent = parent.parent;
					}
					moduleDeclarationCounts.push(count);
				},
				"ModuleBlock:exit"() {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Paired visitor callbacks guarantee a count.
					const count = moduleDeclarationCounts.pop()!;
					activeDeclarations.splice(-count, count);
				},
				PropertyAccessExpression: checkNamespaceAccess,
				"PropertyAccessExpression:exit": exitNamespaceAccess,
				QualifiedName: checkNamespaceAccess,
				"QualifiedName:exit": exitNamespaceAccess,
			},
		};
	},
});
