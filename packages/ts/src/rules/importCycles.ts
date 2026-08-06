import path from "node:path";

import ts, { SyntaxKind } from "typescript";

import {
	typescriptLanguage,
	type AST,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";
import { normalizePath, nullThrows, pathKey } from "@flint.fyi/utils";

import { ruleCreator } from "./ruleCreator.ts";
import { resolveModuleSourceFiles } from "./utils/resolveModuleSourceFiles.ts";

interface Edge {
	range: { begin: number; end: number };
	source: string;
	target: string;
}

interface ProgramGraph {
	displayPaths: Map<string, string>;
	edges: Edge[];
	edgesBySource: Map<string, Edge[]>;
}

function canonicalizeRoute(route: string[]) {
	const rotations = route.map((_, index) => [
		...route.slice(index),
		...route.slice(0, index),
	]);
	return rotations.toSorted((left, right) =>
		left.join("\0").localeCompare(right.join("\0")),
	)[0];
}

function canonicalPath(fileName: string, caseSensitive: boolean) {
	return pathKey(normalizePath(path.resolve(fileName)), caseSensitive);
}

function createGraph(
	program: ts.Program,
	caseSensitive: boolean,
): ProgramGraph {
	const typeChecker = program.getTypeChecker();
	const eligible = new Set(
		program
			.getSourceFiles()
			.filter(
				(sourceFile) =>
					!sourceFile.isDeclarationFile &&
					!program.isSourceFileDefaultLibrary(sourceFile) &&
					!program.isSourceFileFromExternalLibrary(sourceFile),
			),
	);
	const edgesByPair = new Map<string, Edge>();
	const displayPaths = new Map<string, string>();

	for (const sourceFile of eligible) {
		const sourcePath = normalizePath(
			path.resolve(program.getCurrentDirectory(), sourceFile.fileName),
		);
		const source = canonicalPath(sourcePath, caseSensitive);
		displayPaths.set(source, sourcePath);
		const visit = (node: ts.Node) => {
			const literal = moduleLiteralFromNode(node);
			if (literal) {
				const declarations = resolveModuleSourceFiles(
					typeChecker,
					literal,
					eligible,
				);
				if (declarations?.length === 1) {
					const targetPath = normalizePath(
						path.resolve(
							program.getCurrentDirectory(),
							nullThrows(declarations[0], "Expected declaration").fileName,
						),
					);
					const target = canonicalPath(targetPath, caseSensitive);
					displayPaths.set(target, targetPath);
					const edge = {
						range: {
							begin: literal.getStart(sourceFile),
							end: literal.end,
						},
						source,
						target,
					};
					const key = `${source}\0${target}`;
					const previous = edgesByPair.get(key);
					if (!previous || edge.range.begin < previous.range.begin) {
						edgesByPair.set(key, edge);
					}
				}
			}
			ts.forEachChild(node, visit);
		};
		visit(sourceFile);
	}

	const edges = [...edgesByPair.values()].toSorted(
		(left, right) =>
			left.source.localeCompare(right.source) ||
			left.target.localeCompare(right.target),
	);
	const edgesBySource = new Map<string, Edge[]>();
	for (const edge of edges) {
		const sourceEdges = edgesBySource.get(edge.source) ?? [];
		sourceEdges.push(edge);
		edgesBySource.set(edge.source, sourceEdges);
	}
	return { displayPaths, edges, edgesBySource };
}

function cyclesForGraph(graph: ProgramGraph) {
	const cycles = new Map<string, string[]>();
	for (const component of stronglyConnectedComponents(graph)) {
		const members = new Set(component);
		if (
			component.length === 1 &&
			!(
				graph.edgesBySource.get(
					nullThrows(component[0], "Expected component"),
				) ?? []
			).some((edge) => edge.target === component[0])
		) {
			continue;
		}
		for (const edge of graph.edges.filter(
			(edge) => members.has(edge.source) && members.has(edge.target),
		)) {
			const queue: string[][] = [[edge.target]];
			const visited = new Set([edge.target]);
			let returnPath: string[] | undefined;
			while (queue.length && !returnPath) {
				const currentPath = nullThrows(queue.shift(), "Expected queued path");
				const current = nullThrows(currentPath.at(-1), "Expected vertex");
				if (current === edge.source) {
					returnPath = currentPath;
					break;
				}
				for (const next of nullThrows(
					graph.edgesBySource.get(current),
					"Expected strongly connected vertex edges",
				)) {
					if (members.has(next.target) && !visited.has(next.target)) {
						visited.add(next.target);
						queue.push([...currentPath, next.target]);
					}
				}
			}
			const route = nullThrows(
				canonicalizeRoute([
					edge.source,
					...nullThrows(
						returnPath,
						"Expected strongly connected return path",
					).slice(0, -1),
				]),
				"Expected route",
			);
			cycles.set(route.join("\0"), route);
		}
	}
	return cycles;
}

function moduleLiteralFromNode(node: ts.Node) {
	if (ts.isImportDeclaration(node)) {
		return node.importClause?.phaseModifier === SyntaxKind.TypeKeyword
			? undefined
			: node.moduleSpecifier;
	}
	if (ts.isExportDeclaration(node)) {
		return node.isTypeOnly ? undefined : node.moduleSpecifier;
	}
	if (
		ts.isCallExpression(node) &&
		node.expression.kind === SyntaxKind.ImportKeyword &&
		node.arguments.length === 1
	) {
		const [argument] = node.arguments;
		return argument &&
			(ts.isStringLiteral(argument) ||
				ts.isNoSubstitutionTemplateLiteral(argument))
			? argument
			: undefined;
	}
	return undefined;
}

function stronglyConnectedComponents(graph: ProgramGraph) {
	let index = 0;
	const indices = new Map<string, number>();
	const lowLinks = new Map<string, number>();
	const stack: string[] = [];
	const onStack = new Set<string>();
	const components: string[][] = [];
	const vertices = new Set(
		graph.edges.flatMap((edge) => [edge.source, edge.target]),
	);

	const connect = (vertex: string) => {
		indices.set(vertex, index);
		lowLinks.set(vertex, index++);
		stack.push(vertex);
		onStack.add(vertex);
		for (const edge of graph.edgesBySource.get(vertex) ?? []) {
			if (!indices.has(edge.target)) {
				connect(edge.target);
				lowLinks.set(
					vertex,
					Math.min(
						nullThrows(lowLinks.get(vertex), "Expected low link"),
						nullThrows(lowLinks.get(edge.target), "Expected low link"),
					),
				);
			} else if (onStack.has(edge.target)) {
				lowLinks.set(
					vertex,
					Math.min(
						nullThrows(lowLinks.get(vertex), "Expected low link"),
						nullThrows(indices.get(edge.target), "Expected index"),
					),
				);
			}
		}
		if (lowLinks.get(vertex) !== indices.get(vertex)) {
			return;
		}
		const component: string[] = [];
		let popped: string;
		do {
			popped = nullThrows(stack.pop(), "Expected vertex");
			onStack.delete(popped);
			component.push(popped);
		} while (popped !== vertex);
		components.push(component.toSorted());
	};

	for (const vertex of [...vertices].toSorted()) {
		if (!indices.has(vertex)) {
			connect(vertex);
		}
	}
	return components;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports circular dependencies among TypeScript module imports.",
		id: "importCycles",
		presets: ["stylistic"],
	},
	messages: {
		cycle: {
			primary: "Circular module dependency: {{ route }}.",
			secondary: [
				"Circular dependencies can expose partially initialized exports and make initialization order affect runtime behavior.",
			],
			suggestions: [],
		},
	},
	setup(context) {
		const programs = new Set<ts.Program>();
		const selectedFilePaths = new Map<string, string>();
		const caseSensitive = context.host.isCaseSensitiveFS();
		const currentDirectory = context.host.getCurrentDirectory();
		return {
			teardown() {
				const graphs = [...programs].map((program) =>
					createGraph(program, caseSensitive),
				);
				const displayPaths = new Map(
					graphs.flatMap((graph) => [...graph.displayPaths]),
				);
				const cycles = new Map<string, string[]>();
				for (const graph of graphs) {
					for (const [key, route] of cyclesForGraph(graph)) {
						cycles.set(key, route);
					}
				}
				for (const key of [...cycles.keys()].toSorted()) {
					const route = nullThrows(cycles.get(key), "Expected cycle");
					const routeEdges = route.map((source, index) => ({
						source,
						target: route[(index + 1) % route.length],
					}));
					const selected = routeEdges.find((edge) =>
						selectedFilePaths.has(edge.source),
					);
					if (!selected) {
						continue;
					}
					const edge = nullThrows(
						graphs
							.flatMap((graph) => graph.edges)
							.find(
								(edge) =>
									edge.source === selected.source &&
									edge.target === selected.target,
							),
						"Expected edge",
					);
					const filePath = nullThrows(
						selectedFilePaths.get(selected.source),
						"Expected file path",
					);
					context.report({
						data: {
							route: [...route, nullThrows(route[0], "Expected route start")]
								.map((fileName) =>
									normalizePath(
										path.relative(
											currentDirectory,
											nullThrows(
												displayPaths.get(fileName),
												"Expected display path",
											),
										),
									),
								)
								.join(" → "),
						},
						filePath,
						message: "cycle",
						range: edge.range,
					});
				}
			},
			visitors: {
				SourceFile(_node: AST.SourceFile, services: TypeScriptFileServices) {
					programs.add(services.program);
					selectedFilePaths.set(
						canonicalPath(
							path.resolve(
								services.program.getCurrentDirectory(),
								services.sourceFile.fileName,
							),
							caseSensitive,
						),
						services.filePath,
					);
				},
			},
		};
	},
});
