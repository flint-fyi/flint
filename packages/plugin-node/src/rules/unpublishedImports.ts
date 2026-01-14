import { type AST, getTSNodeRange, typescriptLanguage } from "@flint.fyi/ts";
import { parseJsonSafe } from "@flint.fyi/utils";
import * as fsSync from "node:fs";
import * as nodePath from "node:path";
import ts, { SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

interface PackageJson {
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
	files?: string[];
	optionalDependencies?: Record<string, string>;
	peerDependencies?: Record<string, string>;
	private?: boolean;
}

const nodeBuiltins = new Set([
	"assert",
	"buffer",
	"child_process",
	"cluster",
	"console",
	"constants",
	"crypto",
	"dgram",
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
	"stream",
	"string_decoder",
	"sys",
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

const packageJsonCache = new Map<string, PackageJson | undefined>();

function findPackageJson(startDirectory: string): PackageJson | undefined {
	const cached = packageJsonCache.get(startDirectory);
	if (cached !== undefined) {
		return cached;
	}

	let currentDirectory = startDirectory;
	while (currentDirectory !== nodePath.dirname(currentDirectory)) {
		const packageJsonPath = nodePath.join(currentDirectory, "package.json");
		if (fsSync.existsSync(packageJsonPath)) {
			const content = fsSync.readFileSync(packageJsonPath, "utf8");
			const parsed = parseJsonSafe(content) as PackageJson | undefined;
			packageJsonCache.set(startDirectory, parsed);
			return parsed;
		}

		currentDirectory = nodePath.dirname(currentDirectory);
	}

	packageJsonCache.set(startDirectory, undefined);
	return undefined;
}

function getModuleName(specifier: string): string {
	if (specifier.startsWith("@")) {
		const parts = specifier.split("/");
		return parts.slice(0, 2).join("/");
	}

	const firstPart = specifier.split("/")[0];
	return firstPart ?? specifier;
}

function isBuiltinModule(specifier: string) {
	const moduleName = getModuleName(specifier);
	return nodeBuiltins.has(moduleName);
}

function isRelativeOrAbsoluteImport(specifier: string) {
	return (
		specifier.startsWith(".") ||
		specifier.startsWith("/") ||
		specifier.startsWith("node:")
	);
}

function isTypeOnlyImport(node: AST.ImportDeclaration) {
	// Check for `import type {...}` (phaseModifier = TypeKeyword = 156)
	if (node.importClause?.phaseModifier === SyntaxKind.TypeKeyword) {
		return true;
	}

	// Check if all named imports are type-only (inline type imports like `import { type X }`)
	const namedBindings = node.importClause?.namedBindings;
	if (
		namedBindings &&
		namedBindings.kind === SyntaxKind.NamedImports &&
		namedBindings.elements.length > 0 &&
		namedBindings.elements.every((element) => element.isTypeOnly)
	) {
		return true;
	}

	return false;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Disallow importing packages from devDependencies in published files.",
		id: "unpublishedImports",
		presets: ["logical"],
	},
	messages: {
		devDependencyInPublished: {
			primary:
				'"{{ moduleName }}" is listed in devDependencies but this file is published.',
			secondary: [
				"Packages in devDependencies are not installed when consumers install your package.",
				"This import will fail with a Module Not Found error after npm publish.",
			],
			suggestions: [
				"Move the dependency to dependencies if it's needed at runtime.",
				"Exclude this file from the published package using the 'files' field in package.json or .npmignore.",
			],
		},
	},
	setup(context) {
		function checkImportSpecifier(
			specifier: string,
			node: AST.Expression,
			sourceFile: ts.SourceFile,
		) {
			if (isRelativeOrAbsoluteImport(specifier) || isBuiltinModule(specifier)) {
				return;
			}

			const fileDirectory = nodePath.dirname(sourceFile.fileName);
			const packageJson = findPackageJson(fileDirectory);
			if (!packageJson) {
				return;
			}

			if (packageJson.private) {
				return;
			}

			const moduleName = getModuleName(specifier);
			const isInDependencies =
				moduleName in (packageJson.dependencies ?? {}) ||
				moduleName in (packageJson.peerDependencies ?? {}) ||
				moduleName in (packageJson.optionalDependencies ?? {});
			const isInDevDependencies =
				moduleName in (packageJson.devDependencies ?? {});

			if (isInDevDependencies && !isInDependencies) {
				context.report({
					data: { moduleName },
					message: "devDependencyInPublished",
					range: getTSNodeRange(node, sourceFile),
				});
			}
		}

		return {
			dependencies: ["package.json"],
			visitors: {
				CallExpression(node, { sourceFile }) {
					const firstArgument = node.arguments[0];
					if (
						node.expression.kind === SyntaxKind.Identifier &&
						node.expression.text === "require" &&
						firstArgument?.kind === SyntaxKind.StringLiteral
					) {
						checkImportSpecifier(firstArgument.text, firstArgument, sourceFile);
					}
				},
				ExportDeclaration(node, { sourceFile }) {
					if (
						node.moduleSpecifier &&
						node.moduleSpecifier.kind === SyntaxKind.StringLiteral
					) {
						checkImportSpecifier(
							node.moduleSpecifier.text,
							node.moduleSpecifier,
							sourceFile,
						);
					}
				},
				ImportDeclaration(node, { sourceFile }) {
					if (isTypeOnlyImport(node)) {
						return;
					}

					if (node.moduleSpecifier.kind === SyntaxKind.StringLiteral) {
						checkImportSpecifier(
							node.moduleSpecifier.text,
							node.moduleSpecifier,
							sourceFile,
						);
					}
				},
				ImportEqualsDeclaration(node, { sourceFile }) {
					if (
						node.moduleReference.kind === SyntaxKind.ExternalModuleReference &&
						node.moduleReference.expression.kind === SyntaxKind.StringLiteral
					) {
						checkImportSpecifier(
							node.moduleReference.expression.text,
							node.moduleReference.expression,
							sourceFile,
						);
					}
				},
			},
		};
	},
});
