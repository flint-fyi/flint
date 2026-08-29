import ts, { type Node } from "typescript";
import { expect, it } from "vitest";

import { createNodeVisitorsForFile } from "./createNodeVisitorsForFile.ts";
import type { TypeScriptFileServices } from "./language.ts";

function createSourceFile(): ts.SourceFile {
	return ts.createSourceFile(
		"file.ts",
		"const value = 1;",
		ts.ScriptTarget.Latest,
	);
}

const services = {} as TypeScriptFileServices;

it("returns undefined when no visitors are provided", () => {
	expect(
		createNodeVisitorsForFile([{ services, visitors: {} }]),
	).toBeUndefined();
});

it("does not run visitors when their names are unsupported", () => {
	const visited: string[] = [];
	const visitors = createNodeVisitorsForFile([
		{
			services,
			visitors: {
				FirstStatement: () => visited.push("alias"),
				Missing: () => visited.push("missing"),
			},
		},
	]);

	visitors?.visit(createSourceFile());

	expect(visited).toEqual([]);
});

it("runs visitors before their children when only enter visitors are provided", () => {
	const visited: string[] = [];
	const visitors = createNodeVisitorsForFile([
		{
			services,
			visitors: {
				Identifier: (node: Node) =>
					visited.push(`enter ${ts.SyntaxKind[node.kind]}`),
				SourceFile: (node: Node) =>
					visited.push(`enter ${ts.SyntaxKind[node.kind]}`),
			},
		},
	]);

	visitors?.visit(createSourceFile());

	expect(visited).toEqual(["enter SourceFile", "enter Identifier"]);
});

it("runs visitors after their children when only exit visitors are provided", () => {
	const visited: string[] = [];
	const visitors = createNodeVisitorsForFile([
		{
			services,
			visitors: {
				"Identifier:exit": (node: Node) =>
					visited.push(`exit ${ts.SyntaxKind[node.kind]}`),
				"SourceFile:exit": (node: Node) =>
					visited.push(`exit ${ts.SyntaxKind[node.kind]}`),
			},
		},
	]);

	visitors?.visit(createSourceFile());

	expect(visited).toEqual(["exit Identifier", "exit SourceFile"]);
});

it("runs visitors around their children when enter and exit visitors are provided", () => {
	const visited: string[] = [];
	const visitors = createNodeVisitorsForFile([
		{
			services,
			visitors: {
				Identifier: (node: Node) =>
					visited.push(`enter ${ts.SyntaxKind[node.kind]}`),
				"Identifier:exit": (node: Node) =>
					visited.push(`exit ${ts.SyntaxKind[node.kind]}`),
				SourceFile: (node: Node) =>
					visited.push(`enter ${ts.SyntaxKind[node.kind]}`),
				"SourceFile:exit": (node: Node) =>
					visited.push(`exit ${ts.SyntaxKind[node.kind]}`),
			},
		},
	]);

	visitors?.visit(createSourceFile());

	expect(visited).toEqual([
		"enter SourceFile",
		"enter Identifier",
		"exit Identifier",
		"exit SourceFile",
	]);
});
