import ts, { SyntaxKind } from "typescript";
import { describe, expect, it } from "vitest";

import type * as AST from "../types/ast.ts";
import { forEachChild } from "../utils/forEachChild.ts";
import { createScopeManager } from "./scopeManager.ts";

function createSourceFile(sourceText: string, scriptKind = ts.ScriptKind.TS) {
	return ts.createSourceFile(
		"test.ts",
		sourceText,
		ts.ScriptTarget.ESNext,
		true,
		scriptKind,
	) as AST.SourceFile;
}

function findFirstNode<TNode extends AST.AnyNode>(
	node: AST.AnyNode,
	kind: TNode["kind"],
) {
	const found = findNode<TNode>(node, kind);
	if (!found) {
		throw new Error("Expected node to be found.");
	}

	return found;
}

function findNode<TNode extends AST.AnyNode>(
	node: AST.AnyNode,
	kind: TNode["kind"],
): TNode | undefined {
	if (node.kind === kind) {
		return node as TNode;
	}

	return forEachChild(node, (child) => findNode<TNode>(child, kind));
}

function findNthNode<TNode extends AST.AnyNode>(
	node: AST.AnyNode,
	kind: TNode["kind"],
	index: number,
) {
	const matches: TNode[] = [];

	function visit(current: AST.AnyNode) {
		if (current.kind === kind) {
			matches.push(current as TNode);
		}

		forEachChild(current, visit);
	}

	visit(node);
	const found = matches[index];
	if (!found) {
		throw new Error(
			`Expected node of kind ${String(kind)} at index ${String(index)}, found ${String(matches.length)}.`,
		);
	}

	return found;
}

describe(createScopeManager, () => {
	it("resolves identifier references to the nearest lexical declaration", () => {
		const sourceFile = createSourceFile(`
			let value;
			function update(value) {
				value = 1;
			}
			value = 2;
		`);

		const scopeManager = createScopeManager(sourceFile);
		const functionDeclaration = findFirstNode<AST.FunctionDeclaration>(
			sourceFile,
			SyntaxKind.FunctionDeclaration,
		);
		const globalValue = scopeManager.globalScope.variables.find(
			(variable) => variable.name === "value",
		);
		const parameterValue = scopeManager
			.getDeclaredVariables(functionDeclaration)
			.find((variable) => variable.name === "value");

		// The global `value = 2` resolves to the outer let.
		// The inner `value = 1` resolves to the parameter, not the outer let.
		expect(globalValue?.references.map((reference) => reference.text)).toEqual([
			"value",
		]);
		expect(
			parameterValue?.references.map((reference) => reference.text),
		).toEqual(["value"]);
		expect(
			globalValue?.references[0]?.identifier.getStart(sourceFile),
		).toBeGreaterThan(
			parameterValue?.references[0]?.identifier.getStart(sourceFile) ?? 0,
		);
	});

	it("collects variables from function and class declarations", () => {
		const sourceFile = createSourceFile(`
			function fn() {}
			class Cls {}
			const arrow = () => {};
			const expr = function named() {};
		`);

		const scopeManager = createScopeManager(sourceFile);

		expect(
			scopeManager.globalScope.variables.map((variable) => variable.name),
		).toEqual(["fn", "Cls", "arrow", "expr"]);
	});

	it("collects variables from binding patterns in declarations", () => {
		const sourceFile = createSourceFile(`
			const { value, nested: { inner }, list: [item] } = data;
			value;
			inner;
			item;
		`);

		const scopeManager = createScopeManager(sourceFile);

		expect(
			scopeManager.globalScope.variables.map((variable) => variable.name),
		).toEqual(["value", "inner", "item"]);
	});

	it("collects variables declared by parameter nodes including destructuring", () => {
		const sourceFile = createSourceFile(`
			function update({ value, nested: { inner } }) {
				value;
				inner;
			}
		`);

		const scopeManager = createScopeManager(sourceFile);
		const parameter = findFirstNode<AST.ParameterDeclaration>(
			sourceFile,
			SyntaxKind.Parameter,
		);

		// getDeclaredVariables(parameter) returns one variable per leaf
		// binding name inside the destructure pattern.
		expect(
			scopeManager
				.getDeclaredVariables(parameter)
				.map((variable) => variable.name),
		).toEqual(["value", "inner"]);
	});

	it("collects variables from import declarations", () => {
		const sourceFile = createSourceFile(`
			import defaultExport from "default-pkg";
			import { named, renamed as local } from "named-pkg";
			import * as namespace from "namespace-pkg";
		`);

		const scopeManager = createScopeManager(sourceFile);

		expect(
			scopeManager.globalScope.variables.map((variable) => variable.name),
		).toEqual(["defaultExport", "named", "local", "namespace"]);
	});

	it("does not treat declaration-position identifiers as references", () => {
		const sourceFile = createSourceFile(`
			let value = 1;
			value;
		`);

		const scopeManager = createScopeManager(sourceFile);
		const variable = scopeManager.globalScope.variables.find(
			(v) => v.name === "value",
		);

		// `let value` is the declaration; only the trailing `value` is a
		// reference. The declaration identifier must not show up in references.
		expect(variable?.declarations).toHaveLength(1);
		expect(variable?.references).toHaveLength(1);
		expect(variable?.references[0]?.isWrite).toBe(false);
	});

	it("does not include JSX attribute names as references", () => {
		const sourceFile = createSourceFile(
			`
			function render() {
				const name = "test";
				return <input name="value" />;
			}
		`,
			ts.ScriptKind.TSX,
		);

		const scopeManager = createScopeManager(sourceFile);
		const variableDeclaration = findFirstNode<AST.VariableDeclaration>(
			sourceFile,
			SyntaxKind.VariableDeclaration,
		);
		const name = scopeManager.getDeclaredVariables(variableDeclaration)[0];

		// `<input name=...>` looks textually like a reference to `name` but
		// the JSX attribute name is not a value reference.
		expect(name?.references).toEqual([]);
	});

	it("marks assignment and update operators as writes", () => {
		const sourceFile = createSourceFile(`
			let value;
			value = 1;
			value += 2;
			value ??= 3;
			value++;
			++value;
			value;
		`);

		const scopeManager = createScopeManager(sourceFile);
		const variable = scopeManager.globalScope.variables.find(
			(v) => v.name === "value",
		);

		// Every compound assignment and update is a write; the trailing
		// `value;` read is not.
		expect(variable?.references.map((reference) => reference.isWrite)).toEqual([
			true,
			true,
			true,
			true,
			true,
			false,
		]);
	});

	it("marks destructuring assignments and for-in/of targets as writes", () => {
		const sourceFile = createSourceFile(`
			let value;
			[value] = values;
			({ value } = object);
			({ item: value } = object);
			for (value of values) {}
			for (value in object) {}
		`);

		const scopeManager = createScopeManager(sourceFile);
		const variable = scopeManager.globalScope.variables.find(
			(v) => v.name === "value",
		);

		// Array destructure, shorthand and renamed object destructure, and
		// both for-loop bare-target forms all count as writes.
		expect(variable?.references.map((reference) => reference.isWrite)).toEqual([
			true,
			true,
			true,
			true,
			true,
		]);
	});

	it("attributes writes to the inner declaration when shadowed", () => {
		const sourceFile = createSourceFile(`
			let value = 1;
			function update() {
				let value = 2;
				value = 3;
			}
		`);

		const scopeManager = createScopeManager(sourceFile);
		const outerDeclaration = findNthNode<AST.VariableDeclaration>(
			sourceFile,
			SyntaxKind.VariableDeclaration,
			0,
		);
		const innerDeclaration = findNthNode<AST.VariableDeclaration>(
			sourceFile,
			SyntaxKind.VariableDeclaration,
			1,
		);
		const outer = scopeManager
			.getDeclaredVariables(outerDeclaration)
			.find((v) => v.name === "value");
		const inner = scopeManager
			.getDeclaredVariables(innerDeclaration)
			.find((v) => v.name === "value");

		// `value = 3` writes to the inner let, not the outer one.
		expect(outer?.references.filter((r) => r.isWrite)).toEqual([]);
		expect(inner?.references.filter((r) => r.isWrite)).toHaveLength(1);
	});

	it("records read references with isWrite false", () => {
		const sourceFile = createSourceFile(`
			let value = 1;
			console.log(value);
			return value;
		`);

		const scopeManager = createScopeManager(sourceFile);
		const variable = scopeManager.globalScope.variables.find(
			(v) => v.name === "value",
		);

		// Both reads should be present as references, both isWrite false.
		expect(variable?.references).toHaveLength(2);
		expect(variable?.references.every((r) => !r.isWrite)).toBe(true);
	});

	it("separates a catch parameter from a same-named outer variable", () => {
		const sourceFile = createSourceFile(`
			let error;
			try {
				throw error;
			} catch (error) {
				error = new Error();
			}
		`);

		const scopeManager = createScopeManager(sourceFile);
		const catchClause = findFirstNode<AST.CatchClause>(
			sourceFile,
			SyntaxKind.CatchClause,
		);
		const globalError = scopeManager.globalScope.variables.find(
			(v) => v.name === "error",
		);
		const caughtError = scopeManager
			.getDeclaredVariables(catchClause)
			.find((v) => v.name === "error");

		// `throw error` inside `try` reads the outer; `error = new Error()`
		// inside `catch` writes the catch binding. They must be distinct
		// variables.
		expect(globalError).not.toBe(caughtError);
		expect(
			globalError?.references.map((reference) => reference.isWrite),
		).toEqual([false]);
		expect(
			caughtError?.references.map((reference) => reference.isWrite),
		).toEqual([true]);
	});

	it("resolves throw inside a nested catch block to the inner const, not the catch parameter", () => {
		const sourceFile = createSourceFile(`
			try {
				risky();
			} catch (error) {
				{
					const error = new Error();
					throw error;
				}
			}
		`);

		const scopeManager = createScopeManager(sourceFile);
		const catchClause = findFirstNode<AST.CatchClause>(
			sourceFile,
			SyntaxKind.CatchClause,
		);
		// Search inside the catch body so we don't pick up the catch
		// parameter's own VariableDeclaration node.
		const innerDeclaration = findFirstNode<AST.VariableDeclaration>(
			catchClause.block,
			SyntaxKind.VariableDeclaration,
		);
		const throwStatement = findFirstNode<AST.ThrowStatement>(
			catchClause.block,
			SyntaxKind.ThrowStatement,
		);

		const catchVariable = scopeManager
			.getDeclaredVariables(catchClause)
			.find((v) => v.name === "error");
		const innerVariable = scopeManager
			.getDeclaredVariables(innerDeclaration)
			.find((v) => v.name === "error");
		const thrown = scopeManager.findVariable(
			throwStatement.expression as AST.Identifier,
		);

		// Text-name comparison would mistakenly say `throw error` re-throws
		// the caught error. Variable-identity comparison must disagree.
		expect(thrown).toBe(innerVariable);
		expect(thrown).not.toBe(catchVariable);
	});

	it("preserves variable identity for `cause` style references", () => {
		const sourceFile = createSourceFile(`
			try {
				risky();
			} catch (error) {
				throw new Error("wrapper", { cause: error });
			}
		`);

		const scopeManager = createScopeManager(sourceFile);
		const catchClause = findFirstNode<AST.CatchClause>(
			sourceFile,
			SyntaxKind.CatchClause,
		);
		const catchVariable = scopeManager
			.getDeclaredVariables(catchClause)
			.find((v) => v.name === "error");

		// The `cause: error` read should resolve to the catch binding so
		// that a `caughtErrorCauses` rule can prove the wrap is correct.
		const causeRead = catchVariable?.references.find((r) => !r.isWrite);

		expect(causeRead).toBeDefined();
		expect(causeRead?.variable).toBe(catchVariable);
	});

	it("collects default, named, and namespace imports as value variables", () => {
		const sourceFile = createSourceFile(`
			import defaultExport from "default-pkg";
			import { named } from "named-pkg";
			import * as namespace from "namespace-pkg";

			defaultExport;
			named;
			namespace.member;
		`);

		const scopeManager = createScopeManager(sourceFile);
		const names = scopeManager.globalScope.variables.map(
			(variable) => variable.name,
		);

		expect(names).toEqual(["defaultExport", "named", "namespace"]);
	});

	it("skips type-only imports and type-position reads", () => {
		const sourceFile = createSourceFile(`
			import type { Foo } from "./types";
			import { Baz, type Bar } from "./types";

			let value: Foo;
			let other: Bar;
			let typed: Baz;
			Baz;
		`);

		const scopeManager = createScopeManager(sourceFile);
		const variableNames = scopeManager.globalScope.variables.map((v) => v.name);
		const baz = scopeManager.globalScope.variables.find(
			(v) => v.name === "Baz",
		);

		// `Foo` (type-only declaration) and `Bar` (type-only specifier) are
		// not value variables. `Baz` is a value import, but the reads of
		// `Foo`/`Bar` in type position do not show up on `Baz` either.
		expect(variableNames).toEqual(["Baz", "value", "other", "typed"]);
		expect(baz?.references).toHaveLength(1);
	});

	it("records direct writes to imported bindings", () => {
		const sourceFile = createSourceFile(`
			import value, { named } from "pkg";

			value = 1;
			named++;
		`);

		const scopeManager = createScopeManager(sourceFile);
		const value = scopeManager.globalScope.variables.find(
			(v) => v.name === "value",
		);
		const named = scopeManager.globalScope.variables.find(
			(v) => v.name === "named",
		);

		// Direct assignment to an import binding is a write reference -
		// the data needed for an `importAssignments` rule to fire.
		// Namespace-property mutation (e.g. `ns.member = 1`) is a higher
		// concern that belongs in the rule layer, not the scope manager.
		expect(value?.references.map((r) => r.isWrite)).toEqual([true]);
		expect(named?.references.map((r) => r.isWrite)).toEqual([true]);
	});

	it("getReferencesInScope excludes nested function references", () => {
		const sourceFile = createSourceFile(`
			function update(value) {
				value = 1;
				if (value) {
					value = 2;
				}
				function inner() {
					value = 3;
				}
			}
		`);

		const scopeManager = createScopeManager(sourceFile);
		const functionDeclaration = findFirstNode<AST.FunctionDeclaration>(
			sourceFile,
			SyntaxKind.FunctionDeclaration,
		);

		// References from the nested `inner` function are NOT included.
		// The `if` block IS included (block is not a function-like child).
		expect(
			scopeManager
				.getReferencesInScope(functionDeclaration)
				.map((r) => r.identifier.getText(sourceFile)),
		).toEqual(["value", "value", "value"]);
	});

	it("exposes free variables captured from outer scope", () => {
		const sourceFile = createSourceFile(`
			function outer(value) {
				function inner() {
					return value;
				}
			}
		`);

		const scopeManager = createScopeManager(sourceFile);
		const outer = findNthNode<AST.FunctionDeclaration>(
			sourceFile,
			SyntaxKind.FunctionDeclaration,
			0,
		);
		const inner = findNthNode<AST.FunctionDeclaration>(
			sourceFile,
			SyntaxKind.FunctionDeclaration,
			1,
		);
		const outerValue = scopeManager
			.getDeclaredVariables(outer)
			.find((v) => v.name === "value");

		// Every reference inside `inner` whose `variable` resolves to a
		// variable declared OUTSIDE `inner` is a captured free variable.
		const innerReferences = scopeManager.getReferencesInScope(inner);
		const captured = innerReferences.filter((r) => r.variable === outerValue);

		expect(captured).toHaveLength(1);
		expect(captured[0]?.identifier.getText(sourceFile)).toBe("value");
	});

	it("distinguishes let bindings with later writes from those without", () => {
		const sourceFile = createSourceFile(`
			let withWrites = 1;
			withWrites = 2;

			let withoutWrites = 1;
			withoutWrites;
		`);

		const scopeManager = createScopeManager(sourceFile);
		const withWrites = scopeManager.globalScope.variables.find(
			(v) => v.name === "withWrites",
		);
		const withoutWrites = scopeManager.globalScope.variables.find(
			(v) => v.name === "withoutWrites",
		);

		// `withWrites` has a post-init write so it cannot be turned into a
		// `const`. `withoutWrites` has no write references at all, so a
		// `constVariables` rule may report it.
		expect(withWrites?.references.filter((r) => r.isWrite)).toHaveLength(1);
		expect(withoutWrites?.references.filter((r) => r.isWrite)).toEqual([]);
	});

	it("detects destructured let bindings that are later reassigned", () => {
		const sourceFile = createSourceFile(`
			let { value, other } = source;
			[value] = next;
		`);

		const scopeManager = createScopeManager(sourceFile);
		const value = scopeManager.globalScope.variables.find(
			(v) => v.name === "value",
		);
		const other = scopeManager.globalScope.variables.find(
			(v) => v.name === "other",
		);

		// `value` is reassigned via array destructuring; `other` is not.
		expect(value?.references.filter((r) => r.isWrite)).toHaveLength(1);
		expect(other?.references.filter((r) => r.isWrite)).toEqual([]);
	});

	it("detects let bindings reassigned by for-loop iteration", () => {
		const sourceFile = createSourceFile(`
			let value;
			for (value of values) {}
		`);

		const scopeManager = createScopeManager(sourceFile);
		const value = scopeManager.globalScope.variables.find(
			(v) => v.name === "value",
		);

		// The bare for-of target is the only write site; a `constVariables`
		// rule must see it so it does not suggest `const`.
		expect(value?.references.filter((r) => r.isWrite)).toHaveLength(1);
	});

	it("inner block const shadows outer same-named const", () => {
		const sourceFile = createSourceFile(`
			const value = 1;
			{
				const value = 2;
				value;
			}
			value;
		`);

		const scopeManager = createScopeManager(sourceFile);
		const outer = scopeManager.globalScope.variables.find(
			(v) => v.name === "value",
		);
		const innerBlock = findFirstNode<AST.Block>(sourceFile, SyntaxKind.Block);
		const innerDeclaration = findFirstNode<AST.VariableDeclaration>(
			innerBlock,
			SyntaxKind.VariableDeclaration,
		);
		const inner = scopeManager
			.getDeclaredVariables(innerDeclaration)
			.find((v) => v.name === "value");

		// Same name, different variables, different scopes.
		expect(outer).not.toBe(inner);
		expect(outer?.scope).not.toBe(inner?.scope);
		expect(outer?.references).toHaveLength(1);
		expect(inner?.references).toHaveLength(1);
	});

	it("function parameter shadows outer declaration", () => {
		const sourceFile = createSourceFile(`
			const value = 1;
			function update(value) {
				return value;
			}
		`);

		const scopeManager = createScopeManager(sourceFile);
		const outer = scopeManager.globalScope.variables.find(
			(v) => v.name === "value",
		);
		const fn = findFirstNode<AST.FunctionDeclaration>(
			sourceFile,
			SyntaxKind.FunctionDeclaration,
		);
		const parameter = scopeManager
			.getDeclaredVariables(fn)
			.find((v) => v.name === "value");

		// The `return value` reads the parameter, not the outer const.
		expect(outer).not.toBe(parameter);
		expect(outer?.references).toEqual([]);
		expect(parameter?.references).toHaveLength(1);
	});

	it("declares named class expressions in their own scope", () => {
		const sourceFile = createSourceFile(`
			const Value = class Value {
				method() {
					Value = undefined;
				}
			};
			Value = undefined;
		`);

		const scopeManager = createScopeManager(sourceFile);
		const variableDeclaration = findFirstNode<AST.VariableDeclaration>(
			sourceFile,
			SyntaxKind.VariableDeclaration,
		);
		const classExpression = findFirstNode<AST.ClassExpression>(
			sourceFile,
			SyntaxKind.ClassExpression,
		);
		const outerValue = scopeManager
			.getDeclaredVariables(variableDeclaration)
			.find((v) => v.name === "Value");
		const innerValue = scopeManager
			.getDeclaredVariables(classExpression)
			.find((v) => v.name === "Value");

		// A named class expression introduces its name into its own scope
		// only - the inner `Value = undefined` writes the inner binding;
		// the outer `Value = undefined` writes the outer const.
		expect(outerValue).not.toBe(innerValue);
		expect(
			outerValue?.references.map((reference) => reference.isWrite),
		).toEqual([true]);
		expect(
			innerValue?.references.map((reference) => reference.isWrite),
		).toEqual([true]);
	});

	it("tags each variable with its definition kind", () => {
		const sourceFile = createSourceFile(`
			import imported from "mod";
			const declared = 1;
			class Cls {}
			function fn(param) {
				try {} catch (caught) {}
			}
		`);

		const scopeManager = createScopeManager(sourceFile);
		const fn = findFirstNode<AST.FunctionDeclaration>(
			sourceFile,
			SyntaxKind.FunctionDeclaration,
		);
		const catchClause = findFirstNode<AST.CatchClause>(
			sourceFile,
			SyntaxKind.CatchClause,
		);

		const global = (name: string) =>
			scopeManager.globalScope.variables.find((v) => v.name === name);

		expect(global("imported")?.definitions[0]?.kind).toBe("import");
		expect(global("declared")?.definitions[0]?.kind).toBe("variable");
		expect(global("Cls")?.definitions[0]?.kind).toBe("class");
		expect(global("fn")?.definitions[0]?.kind).toBe("function");

		const param = scopeManager
			.getDeclaredVariables(fn)
			.find((v) => v.name === "param");
		expect(param?.definitions[0]?.kind).toBe("parameter");

		const caught = scopeManager
			.getDeclaredVariables(catchClause)
			.find((v) => v.name === "caught");
		expect(caught?.definitions[0]?.kind).toBe("catch");
	});

	it("getScope returns the scope a boundary node creates", () => {
		const sourceFile = createSourceFile(`
			function outer() {
				function inner() {}
			}
		`);

		const scopeManager = createScopeManager(sourceFile);
		const outer = findNthNode<AST.FunctionDeclaration>(
			sourceFile,
			SyntaxKind.FunctionDeclaration,
			0,
		);
		const inner = findNthNode<AST.FunctionDeclaration>(
			sourceFile,
			SyntaxKind.FunctionDeclaration,
			1,
		);

		// A scope-boundary node maps to the scope it creates, not its parent.
		expect(scopeManager.getScope(inner).block).toBe(inner);
		expect(scopeManager.getScope(inner).upper).toBe(
			scopeManager.getScope(outer),
		);
		expect(scopeManager.getScope(outer).upper).toBe(scopeManager.globalScope);
	});

	it("getScope returns the innermost enclosing scope for a non-boundary node", () => {
		const sourceFile = createSourceFile(`
			const outerValue = 1;
			function fn() {
				const innerValue = 2;
				innerValue;
			}
		`);

		const scopeManager = createScopeManager(sourceFile);
		const fn = findFirstNode<AST.FunctionDeclaration>(
			sourceFile,
			SyntaxKind.FunctionDeclaration,
		);
		// Identifiers in source order: outerValue, fn, innerValue (declaration),
		// innerValue (reference). The reference is the fourth.
		const innerReference = findNthNode<AST.Identifier>(
			sourceFile,
			SyntaxKind.Identifier,
			3,
		);

		const scope = scopeManager.getScope(innerReference);
		expect(scope.block).toBe(fn);
		expect(scope.upper).toBe(scopeManager.globalScope);
	});
});
