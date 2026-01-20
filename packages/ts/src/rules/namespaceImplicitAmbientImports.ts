import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts, { SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function hasExportModifier(node: AST.Statement) {
	return !!(
		ts.canHaveModifiers(node) &&
		ts
			.getModifiers(node)
			?.some((modifier) => modifier.kind === SyntaxKind.ExportKeyword)
	);
}

function hasNamedExport(statements: readonly AST.Statement[]) {
	return statements.some(
		(statement) =>
			statement.kind === SyntaxKind.ExportDeclaration &&
			statement.exportClause?.kind === SyntaxKind.NamedExports,
	);
}

function hasNonExportedMember(statements: readonly AST.Statement[]) {
	return statements.some(
		(statement) =>
			!hasExportModifier(statement) &&
			(statement.kind === SyntaxKind.TypeAliasDeclaration ||
				statement.kind === SyntaxKind.InterfaceDeclaration ||
				statement.kind === SyntaxKind.ClassDeclaration ||
				statement.kind === SyntaxKind.EnumDeclaration ||
				statement.kind === SyntaxKind.FunctionDeclaration ||
				statement.kind === SyntaxKind.VariableStatement ||
				statement.kind === SyntaxKind.ModuleDeclaration),
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports declared namespaces that implicitly export all members.",
		id: "namespaceImplicitAmbientImports",
		presets: ["stylisticStrict"],
	},
	messages: {
		implicitExports: {
			primary:
				"Declared namespaces without explicit exports implicitly export all members.",
			secondary: [
				"When a declared namespace has no named export statements, all its members are implicitly exported.",
				"This can lead to unintended exports and make it harder to understand what the namespace exposes.",
			],
			suggestions: [
				"Add an `export {};` statement to opt out of implicit exports, then explicitly export the members you intend to expose.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				ModuleDeclaration: (node, { sourceFile }) => {
					if (
						!node.modifiers?.some(
							(modifier) => modifier.kind === SyntaxKind.DeclareKeyword,
						) ||
						node.name.kind !== SyntaxKind.Identifier ||
						!node.body ||
						node.body.kind !== SyntaxKind.ModuleBlock
					) {
						return;
					}

					const statements = node.body.statements;

					if (
						statements.length === 0 ||
						hasNamedExport(statements) ||
						!hasNonExportedMember(statements)
					) {
						return;
					}

					context.report({
						message: "implicitExports",
						range: getTSNodeRange(node, sourceFile),
					});
				},
			},
		};
	},
});
