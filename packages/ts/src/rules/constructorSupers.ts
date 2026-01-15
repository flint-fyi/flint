import { type AST, typescriptLanguage } from "@flint.fyi/typescript-language";
import * as tsutils from "ts-api-utils";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function classHasExtendsClause(
	node: AST.ClassDeclaration | AST.ClassExpression,
) {
	return node.heritageClauses?.some(
		(clause) => clause.token === ts.SyntaxKind.ExtendsKeyword,
	);
}

function containsSuperCall(node: ts.Node): boolean {
	if (
		ts.isCallExpression(node) &&
		node.expression.kind === ts.SyntaxKind.SuperKeyword
	) {
		return true;
	}

	if (tsutils.isFunctionScopeBoundary(node)) {
		return false;
	}

	return ts.forEachChild(node, containsSuperCall) ?? false;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports constructors of derived classes that do not call `super()`, and constructors of non-derived classes that call `super()`.",
		id: "constructorSupers",
		presets: ["untyped"],
	},
	messages: {
		missingSuperCall: {
			primary:
				"Constructors of derived classes must call `super()` before using `this` or returning.",
			secondary: [
				"The derived class constructor must initialize the parent class by calling `super()` before accessing `this`.",
				"Failing to call `super()` in a derived class constructor causes a runtime error.",
			],
			suggestions: [
				"Add a `super()` call at the beginning of the constructor.",
				"Pass required arguments to `super()` if the parent constructor expects them.",
			],
		},
		unexpectedSuperCall: {
			primary: "Constructors of non-derived classes must not call `super()`.",
			secondary: [
				"This class does not extend another class, so there is no parent constructor to call.",
				"Calling `super()` in a non-derived class causes a syntax error.",
			],
			suggestions: [
				"Remove the `super()` call.",
				"If this class should inherit from another class, add an `extends` clause.",
			],
		},
	},
	setup(context) {
		function checkConstructor(
			classNode: AST.ClassDeclaration | AST.ClassExpression,
			constructor: AST.ConstructorDeclaration,
			sourceFile: ts.SourceFile,
		) {
			if (!constructor.body) {
				return;
			}

			const isDerivedClass = classHasExtendsClause(classNode) ?? false;
			const hasSuperCall = containsSuperCall(constructor.body);

			if (isDerivedClass && !hasSuperCall) {
				const constructorKeyword = constructor
					.getChildren(sourceFile)
					.find((child) => child.kind === ts.SyntaxKind.Constructor);

				context.report({
					message: "missingSuperCall",
					range: {
						begin:
							constructorKeyword?.getStart(sourceFile) ??
							constructor.getStart(sourceFile),
						end:
							constructorKeyword?.getEnd() ??
							constructor.getStart(sourceFile) + 11,
					},
				});
			}

			if (!isDerivedClass && hasSuperCall) {
				findAndReportSuperCalls(constructor.body, sourceFile);
			}
		}

		function findAndReportSuperCalls(node: ts.Node, sourceFile: ts.SourceFile) {
			if (
				ts.isCallExpression(node) &&
				node.expression.kind === ts.SyntaxKind.SuperKeyword
			) {
				context.report({
					message: "unexpectedSuperCall",
					range: {
						begin: node.getStart(sourceFile),
						end: node.getEnd(),
					},
				});
				return;
			}

			if (tsutils.isFunctionScopeBoundary(node)) {
				return;
			}

			ts.forEachChild(node, (child) => {
				findAndReportSuperCalls(child, sourceFile);
			});
		}

		function checkClass(
			node: AST.ClassDeclaration | AST.ClassExpression,
			{ sourceFile }: { sourceFile: ts.SourceFile },
		) {
			for (const member of node.members) {
				if (member.kind === ts.SyntaxKind.Constructor) {
					checkConstructor(node, member, sourceFile);
				}
			}
		}

		return {
			visitors: {
				ClassDeclaration: checkClass,
				ClassExpression: checkClass,
			},
		};
	},
});
