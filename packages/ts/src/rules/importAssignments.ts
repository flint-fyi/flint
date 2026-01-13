import * as tsutils from "ts-api-utils";
import ts from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";
import * as AST from "../types/ast.ts";
import type { Checker } from "../types/checker.ts";
import { isGlobalDeclarationOfName } from "../utils/isGlobalDeclarationOfName.ts";

interface ImportBinding {
	identifier: AST.Identifier;
	isNamespaceImport: boolean;
}

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports attempting to reassign imported bindings, which would cause a runtime error.",
		id: "importAssignments",
		preset: "untyped",
	},
	messages: {
		noImportAssign: {
			primary: "'{{name}}' is an imported binding and cannot be reassigned.",
			secondary: [
				"ES module imports are read-only. Attempting to reassign them throws a TypeError at runtime.",
			],
			suggestions: [
				"Create a local variable with a different name if you need to modify the value.",
			],
		},
		noNamespaceMemberAssign: {
			primary:
				"The members of '{{name}}' are read-only and cannot be modified.",
			secondary: [
				"ES namespace imports are immutable. Modifying their properties throws a TypeError at runtime.",
			],
			suggestions: [
				"Use named imports for specific bindings or create a local copy of the value.",
			],
		},
	},
	setup(context) {
		function collectImportBindings(
			sourceFile: AST.SourceFile,
		): Map<string, ImportBinding> {
			const imports = new Map<string, ImportBinding>();

			function visit(node: ts.Node): void {
				if (ts.isImportDeclaration(node)) {
					const importClause = node.importClause;
					if (!importClause) {
						return;
					}

					// Default import: import foo from "mod"
					if (importClause.name) {
						imports.set(importClause.name.text, {
							identifier: importClause.name,
							isNamespaceImport: false,
						});
					}

					const namedBindings = importClause.namedBindings;
					if (namedBindings) {
						// Namespace import: import * as foo from "mod"
						if (ts.isNamespaceImport(namedBindings)) {
							imports.set(namedBindings.name.text, {
								identifier: namedBindings.name,
								isNamespaceImport: true,
							});
						}
						// Named imports: import { foo, bar } from "mod"
						else if (ts.isNamedImports(namedBindings)) {
							for (const specifier of namedBindings.elements) {
								imports.set(specifier.name.text, {
									identifier: specifier.name,
									isNamespaceImport: false,
								});
							}
						}
					}
				}

				ts.forEachChild(node, visit);
			}

			visit(sourceFile);
			return imports;
		}

		function isDirectModification(identifier: ts.Identifier): boolean {
			const parent = identifier.parent;

			// Assignment expressions (=, +=, -=, etc.)
			if (
				ts.isBinaryExpression(parent) &&
				tsutils.isAssignmentKind(parent.operatorToken.kind) &&
				parent.left === identifier
			) {
				return true;
			}

			// Unary expressions (++, --)
			if (
				(ts.isPostfixUnaryExpression(parent) ||
					ts.isPrefixUnaryExpression(parent)) &&
				parent.operand === identifier
			) {
				return true;
			}

			return false;
		}

		function isMemberModification(
			identifier: ts.Identifier,
			memberExpr: ts.ElementAccessExpression | ts.PropertyAccessExpression,
			typeChecker: Checker,
		): boolean {
			const parent = memberExpr.parent;

			// mod.prop = value or mod["prop"] = value
			if (
				ts.isBinaryExpression(parent) &&
				tsutils.isAssignmentKind(parent.operatorToken.kind) &&
				parent.left === memberExpr
			) {
				return true;
			}

			// mod.prop++ or ++mod.prop
			if (
				(ts.isPostfixUnaryExpression(parent) ||
					ts.isPrefixUnaryExpression(parent)) &&
				parent.operand === memberExpr
			) {
				return true;
			}

			// delete mod.prop
			if (ts.isDeleteExpression(parent) && parent.expression === memberExpr) {
				return true;
			}

			// for (mod.prop in obj) or for (mod.prop of arr)
			if (
				(ts.isForInStatement(parent) || ts.isForOfStatement(parent)) &&
				parent.initializer === memberExpr
			) {
				return true;
			}

			// Object.assign(mod, ...), Object.defineProperty(mod, ...), etc.
			if (ts.isCallExpression(parent) && parent.arguments[0] === memberExpr) {
				return isWellKnownMutationCall(parent, typeChecker);
			}

			return false;
		}

		function isLikelyGlobalBuiltin(
			identifier: ts.Identifier,
			name: string,
			typeChecker: Checker,
		): boolean {
			// Try to resolve the symbol
			const symbol = typeChecker.getSymbolAtLocation(identifier);
			if (!symbol) {
				// If we can't resolve the symbol, assume it's the global
				// This handles cases where the type checker doesn't have full lib info
				return true;
			}

			// If we can resolve it, check if it's global
			return isGlobalDeclarationOfName(identifier, name, typeChecker);
		}

		function isWellKnownMutationCall(
			callExpr: ts.CallExpression,
			typeChecker: Checker,
		): boolean {
			const callee = callExpr.expression;
			if (!ts.isPropertyAccessExpression(callee)) {
				return false;
			}

			const objectName = callee.expression;
			const methodName = callee.name.text;

			if (!ts.isIdentifier(objectName)) {
				return false;
			}

			const objName = objectName.text;

			// Object methods that mutate first argument
			if (objName === "Object") {
				const mutatingMethods = [
					"assign",
					"defineProperty",
					"defineProperties",
					"freeze",
					"setPrototypeOf",
				];
				if (
					mutatingMethods.includes(methodName) &&
					isLikelyGlobalBuiltin(objectName, "Object", typeChecker)
				) {
					return true;
				}
			}

			// Reflect methods that mutate first argument
			if (objName === "Reflect") {
				const mutatingMethods = [
					"defineProperty",
					"deleteProperty",
					"set",
					"setPrototypeOf",
				];
				if (
					mutatingMethods.includes(methodName) &&
					isLikelyGlobalBuiltin(objectName, "Reflect", typeChecker)
				) {
					return true;
				}
			}

			return false;
		}

		function isDirectNamespaceMutation(
			identifier: ts.Identifier,
			typeChecker: Checker,
		): boolean {
			const parent = identifier.parent;

			// Object.assign(mod, ...)
			if (ts.isCallExpression(parent) && parent.arguments[0] === identifier) {
				return isWellKnownMutationCall(parent, typeChecker);
			}

			return false;
		}

		function isShadowed(
			identifier: ts.Identifier,
			importBinding: ImportBinding,
			sourceFile: AST.SourceFile,
		): boolean {
			// Walk up the tree to check if the identifier is shadowed by a local declaration
			let current: ts.Node = identifier;

			while (current !== sourceFile) {
				const parent: ts.Node = current.parent;

				// Check for block-scoped declarations
				if (ts.isBlock(parent) || ts.isSourceFile(parent)) {
					for (const statement of parent.statements) {
						if (ts.isVariableStatement(statement)) {
							for (const decl of statement.declarationList.declarations) {
								if (
									ts.isIdentifier(decl.name) &&
									decl.name.text === identifier.text &&
									decl.name !== identifier &&
									decl.name !== importBinding.identifier
								) {
									// Check if this declaration comes before our usage
									if (
										decl.getStart(sourceFile) < identifier.getStart(sourceFile)
									) {
										return true;
									}
								}
							}
						}
						if (ts.isFunctionDeclaration(statement)) {
							if (
								statement.name &&
								statement.name.text === identifier.text &&
								statement.name !== identifier &&
								statement.name !== importBinding.identifier
							) {
								return true;
							}
						}
					}
				}

				// Check for function parameters
				if (
					ts.isFunctionDeclaration(parent) ||
					ts.isFunctionExpression(parent) ||
					ts.isArrowFunction(parent) ||
					ts.isMethodDeclaration(parent)
				) {
					for (const param of parent.parameters) {
						if (
							ts.isIdentifier(param.name) &&
							param.name.text === identifier.text
						) {
							return true;
						}
					}
				}

				// Check for catch clause binding
				if (ts.isCatchClause(parent) && parent.variableDeclaration) {
					const bindingName = parent.variableDeclaration.name;
					if (
						ts.isIdentifier(bindingName) &&
						bindingName.text === identifier.text
					) {
						return true;
					}
				}

				current = parent;
			}

			return false;
		}

		return {
			visitors: {
				SourceFile: (sourceFile, { typeChecker }) => {
					const imports = collectImportBindings(sourceFile);

					function checkNode(node: ts.Node): void {
						if (ts.isIdentifier(node)) {
							const binding = imports.get(node.text);
							if (
								binding &&
								node !== binding.identifier &&
								!isShadowed(node, binding, sourceFile)
							) {
								// Check for direct modification
								if (isDirectModification(node)) {
									context.report({
										data: { name: node.text },
										message: "noImportAssign",
										range: getTSNodeRange(node, sourceFile),
									});
									return;
								}

								// For namespace imports, also check member modifications
								if (binding.isNamespaceImport) {
									const parent = node.parent;
									if (
										(ts.isPropertyAccessExpression(parent) ||
											ts.isElementAccessExpression(parent)) &&
										parent.expression === node
									) {
										if (isMemberModification(node, parent, typeChecker)) {
											context.report({
												data: { name: node.text },
												message: "noNamespaceMemberAssign",
												range: getTSNodeRange(node, sourceFile),
											});
											return;
										}
									}
									// Check for direct mutation via Object.assign(mod, ...)
									if (isDirectNamespaceMutation(node, typeChecker)) {
										context.report({
											data: { name: node.text },
											message: "noNamespaceMemberAssign",
											range: getTSNodeRange(node, sourceFile),
										});
										return;
									}
								}
							}
						}

						ts.forEachChild(node, checkNode);
					}

					checkNode(sourceFile);
				},
			},
		};
	},
});
