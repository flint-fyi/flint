import {
	getTSNodeRange,
	isGlobalVariable,
	typescriptLanguage,
} from "@flint.fyi/ts";
import * as semver from "semver";
import ts, { SyntaxKind } from "typescript";
import { z } from "zod";

import { ruleCreator } from "./ruleCreator.ts";
import {
	nodeBuiltinAPIs,
	type NodeBuiltinAPISupport,
	nodeBuiltinModules,
} from "./utils/nodeBuiltinsData.ts";

const nodeModuleNames = new Set([
	"assert",
	"async_hooks",
	"buffer",
	"child_process",
	"cluster",
	"console",
	"constants",
	"crypto",
	"dgram",
	"diagnostics_channel",
	"dns",
	"domain",
	"events",
	"fs",
	"http",
	"http2",
	"https",
	"inspector",
	"module",
	"net",
	"os",
	"path",
	"perf_hooks",
	"process",
	"punycode",
	"querystring",
	"readline",
	"repl",
	"sea",
	"sqlite",
	"stream",
	"string_decoder",
	"sys",
	"test",
	"timers",
	"tls",
	"trace_events",
	"tty",
	"url",
	"util",
	"v8",
	"vm",
	"wasi",
	"worker_threads",
	"zlib",
]);

function isNodeBuiltinModule(specifier: string) {
	const normalized = normalizeModuleSpecifier(specifier);
	const base = normalized.split("/")[0];
	return nodeModuleNames.has(base);
}

function isUnsupported(minVersion: string, apiSupport: NodeBuiltinAPISupport) {
	const min = semver.coerce(minVersion);
	const added = semver.coerce(apiSupport.addedIn);
	if (!min || !added) {
		return false;
	}
	return semver.lt(min, added);
}

function normalizeModuleSpecifier(specifier: string) {
	return specifier.replace(/^node:/, "");
}

function shouldCheckModuleSpecifier(specifier: string) {
	const normalized = normalizeModuleSpecifier(specifier);
	return nodeBuiltinModules[normalized] !== undefined;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Disallow usage of Node.js built-in APIs not supported by the configured Node.js version.",
		id: "unsupportedNodeAPIs",
		presets: ["logical"],
	},
	messages: {
		unsupportedAPI: {
			primary:
				"The `{{ apiName }}` API is not available in Node.js {{ minVersion }}.",
			secondary: [
				"The `{{ apiName }}` API was added in Node.js {{ addedIn }}.",
				"Ensure all target Node.js versions support this API, or provide a polyfill.",
			],
			suggestions: [
				"Update your minimum Node.js version to {{ addedIn }} or later.",
				"Provide a polyfill or runtime check for older versions.",
			],
		},
	},
	options: {
		minVersion: z
			.string()
			.default("18.0.0")
			.describe("The minimum Node.js version the project supports."),
	},
	setup(context) {
		const moduleBindings = new Map<string, string>();

		function checkModuleSupport(
			moduleKey: string,
			node: ts.Node,
			sourceFile: ts.SourceFile,
			minVersion: string,
		) {
			const info = nodeBuiltinModules[moduleKey];
			if (!info) {
				return;
			}

			if (!isUnsupported(minVersion, info)) {
				return;
			}

			context.report({
				data: {
					addedIn: info.addedIn,
					apiName: moduleKey,
					minVersion,
				},
				message: "unsupportedAPI",
				range: getTSNodeRange(node, sourceFile),
			});
		}

		function checkAPISupport(
			apiKey: string,
			node: ts.Node,
			sourceFile: ts.SourceFile,
			minVersion: string,
		) {
			const info = nodeBuiltinAPIs[apiKey];
			if (!info) {
				return;
			}

			if (!isUnsupported(minVersion, info)) {
				return;
			}

			context.report({
				data: {
					addedIn: info.addedIn,
					apiName: apiKey,
					minVersion,
				},
				message: "unsupportedAPI",
				range: getTSNodeRange(node, sourceFile),
			});
		}

		function getPropertyAccessPath(node: ts.PropertyAccessExpression) {
			const parts: string[] = [];
			let current: ts.Expression = node;

			while (current.kind === SyntaxKind.PropertyAccessExpression) {
				const propertyAccess = current as ts.PropertyAccessExpression;
				parts.unshift(propertyAccess.name.text);
				current = propertyAccess.expression;
			}

			if (current.kind !== SyntaxKind.Identifier) {
				return undefined;
			}

			return {
				parts,
				rootName: (current as ts.Identifier).text,
			};
		}

		return {
			visitors: {
				CallExpression(node, { options, sourceFile }) {
					if (
						node.expression.kind !== SyntaxKind.Identifier ||
						(node.expression as ts.Identifier).text !== "require" ||
						node.arguments.length === 0
					) {
						return;
					}

					const arg = node.arguments[0];
					if (arg.kind !== SyntaxKind.StringLiteral) {
						return;
					}

					const specifier = (arg as ts.StringLiteral).text;
					if (!isNodeBuiltinModule(specifier)) {
						return;
					}

					const normalized = normalizeModuleSpecifier(specifier);

					if (shouldCheckModuleSpecifier(specifier)) {
						checkModuleSupport(normalized, arg, sourceFile, options.minVersion);
					}

					const parent = node.parent;
					if (
						parent.kind === SyntaxKind.VariableDeclaration &&
						(parent as ts.VariableDeclaration).name.kind ===
							SyntaxKind.Identifier
					) {
						const binding = (parent as ts.VariableDeclaration)
							.name as ts.Identifier;
						moduleBindings.set(binding.text, normalized);
					}
				},

				Identifier(node, { options, sourceFile, typeChecker }) {
					if (
						node.parent.kind === SyntaxKind.PropertyAccessExpression &&
						(node.parent as ts.PropertyAccessExpression).name === node
					) {
						return;
					}

					if (node.parent.kind === SyntaxKind.ImportSpecifier) {
						return;
					}

					if (node.parent.kind === SyntaxKind.ImportClause) {
						return;
					}

					if (node.parent.kind === SyntaxKind.NamespaceImport) {
						return;
					}

					if (
						node.parent.kind === SyntaxKind.VariableDeclaration &&
						(node.parent as ts.VariableDeclaration).name === node
					) {
						return;
					}

					if (node.parent.kind === SyntaxKind.FunctionDeclaration) {
						return;
					}

					if (node.parent.kind === SyntaxKind.Parameter) {
						return;
					}

					const name = node.text;
					if (nodeBuiltinAPIs[name] && isGlobalVariable(node, typeChecker)) {
						checkAPISupport(name, node, sourceFile, options.minVersion);
					}
				},

				ImportDeclaration(node, { options, sourceFile }) {
					if (node.moduleSpecifier.kind !== SyntaxKind.StringLiteral) {
						return;
					}

					const specifier = (node.moduleSpecifier as ts.StringLiteral).text;
					if (!isNodeBuiltinModule(specifier)) {
						return;
					}

					const normalized = normalizeModuleSpecifier(specifier);

					if (shouldCheckModuleSpecifier(specifier)) {
						checkModuleSupport(
							normalized,
							node.moduleSpecifier,
							sourceFile,
							options.minVersion,
						);
					}

					if (node.importClause?.namedBindings) {
						const bindings = node.importClause.namedBindings;
						if (bindings.kind === SyntaxKind.NamespaceImport) {
							moduleBindings.set(bindings.name.text, normalized);
						}
					}

					if (node.importClause?.name) {
						moduleBindings.set(node.importClause.name.text, normalized);
					}
				},

				PropertyAccessExpression(node, { options, sourceFile }) {
					const pathInfo = getPropertyAccessPath(node);
					if (!pathInfo) {
						return;
					}

					const { parts, rootName } = pathInfo;
					const moduleSpec = moduleBindings.get(rootName);

					if (moduleSpec) {
						const apiPath = [moduleSpec, ...parts].join(".");
						checkAPISupport(apiPath, node, sourceFile, options.minVersion);
						return;
					}

					const globalPath = [rootName, ...parts].join(".");
					if (nodeBuiltinAPIs[globalPath]) {
						checkAPISupport(globalPath, node, sourceFile, options.minVersion);
					}
				},
			},
		};
	},
});
