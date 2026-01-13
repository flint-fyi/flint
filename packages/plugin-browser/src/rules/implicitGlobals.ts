import { type AST, getTSNodeRange, typescriptLanguage } from "@flint.fyi/ts";
import ts, { SyntaxKind } from "typescript";

export default typescriptLanguage.createRule({
	about: {
		description:
			"Prevents implicit global variable declarations in browser scripts.",
		id: "implicitGlobals",
		preset: "logical",
	},
	messages: {
		implicitGlobal: {
			primary:
				"This {{ declarationType }} creates an implicit global variable in browser scripts.",
			secondary: [
				"In browser scripts (non-modules), top-level `var` declarations and function declarations create properties on the global window object.",
				"This can lead to unexpected behavior and naming conflicts.",
				"Use modules (with import/export) or explicit window property assignment instead.",
			],
			suggestions: [
				"Convert to a module with export/import",
				"Use let or const instead (they don't create globals)",
				"Explicitly assign to window if global access is needed",
			],
		},
	},
	setup(context) {
		function checkFunctionDeclaration(
			node: AST.FunctionDeclaration,
			sourceFile: AST.SourceFile,
		) {
			if (!node.name) {
				return;
			}

			context.report({
				data: { declarationType: "function declaration" },
				message: "implicitGlobal",
				range: getTSNodeRange(
					node.name,
					sourceFile as unknown as ts.SourceFile,
				),
			});
		}

		function checkVariableStatement(
			node: AST.VariableStatement,
			sourceFile: AST.SourceFile,
		) {
			if (
				node.modifiers?.some(
					(modifier) => modifier.kind === SyntaxKind.ExportKeyword,
				) ||
				node.declarationList.flags & ts.NodeFlags.BlockScoped
			) {
				return;
			}

			for (const declaration of node.declarationList.declarations) {
				if (declaration.name.kind === SyntaxKind.Identifier) {
					context.report({
						data: { declarationType: "var declaration" },
						message: "implicitGlobal",
						range: getTSNodeRange(
							declaration.name,
							sourceFile as unknown as ts.SourceFile,
						),
					});
				}
			}
		}

		return {
			visitors: {
				SourceFile(node) {
					const isModule = node.statements.some(
						(statement) =>
							statement.kind === SyntaxKind.ImportDeclaration ||
							statement.kind === SyntaxKind.ExportDeclaration ||
							statement.kind === SyntaxKind.ExportAssignment ||
							(statement.kind === SyntaxKind.VariableStatement &&
								(statement.modifiers?.some(
									(modifier) => modifier.kind === SyntaxKind.ExportKeyword,
								) ??
									false)) ||
							(statement.kind === SyntaxKind.FunctionDeclaration &&
								(statement.modifiers?.some(
									(modifier) => modifier.kind === SyntaxKind.ExportKeyword,
								) ??
									false)),
					);

					if (isModule) {
						return;
					}

					for (const statement of node.statements) {
						if (statement.kind === SyntaxKind.FunctionDeclaration) {
							checkFunctionDeclaration(statement, node);
						} else if (statement.kind === SyntaxKind.VariableStatement) {
							checkVariableStatement(statement, node);
						}
					}
				},
			},
		};
	},
});
