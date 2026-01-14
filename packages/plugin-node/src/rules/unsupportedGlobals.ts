import { getTSNodeRange, typescriptLanguage } from "@flint.fyi/ts";
import { parseJsonSafe } from "@flint.fyi/utils";
import * as fsSync from "node:fs";
import * as nodePath from "node:path";
import semver from "semver";
import { SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

interface GlobalInfo {
	name: string;
	supportedSince: string;
}

interface PackageJson {
	engines?: {
		node?: string;
	};
}

const unsupportedGlobals: Record<string, GlobalInfo> = {
	AggregateError: { name: "AggregateError", supportedSince: "15.0.0" },
	Array: {
		name: "Array",
		supportedSince: "0.10.0",
	},
	ArrayBuffer: { name: "ArrayBuffer", supportedSince: "0.10.0" },
	Atomics: { name: "Atomics", supportedSince: "8.10.0" },
	BigInt: { name: "BigInt", supportedSince: "10.4.0" },
	BigInt64Array: { name: "BigInt64Array", supportedSince: "10.4.0" },
	BigUint64Array: { name: "BigUint64Array", supportedSince: "10.4.0" },
	FinalizationRegistry: {
		name: "FinalizationRegistry",
		supportedSince: "14.6.0",
	},
	globalThis: { name: "globalThis", supportedSince: "12.0.0" },
	Map: { name: "Map", supportedSince: "0.12.0" },
	Promise: { name: "Promise", supportedSince: "0.12.0" },
	Proxy: { name: "Proxy", supportedSince: "6.0.0" },
	Reflect: { name: "Reflect", supportedSince: "6.0.0" },
	Set: { name: "Set", supportedSince: "0.12.0" },
	SharedArrayBuffer: { name: "SharedArrayBuffer", supportedSince: "8.10.0" },
	Symbol: { name: "Symbol", supportedSince: "0.12.0" },
	WeakMap: { name: "WeakMap", supportedSince: "0.12.0" },
	WeakRef: { name: "WeakRef", supportedSince: "14.6.0" },
	WeakSet: { name: "WeakSet", supportedSince: "0.12.0" },
};

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

function getMinNodeVersion(engineVersion: string): string | undefined {
	const coerced = semver.coerce(engineVersion);
	if (coerced) {
		return coerced.version;
	}

	const minVersion = semver.minVersion(engineVersion);
	return minVersion?.version;
}

function isGlobalSupported(
	globalInfo: GlobalInfo,
	configuredVersion: string | undefined,
) {
	if (!configuredVersion) {
		return true;
	}

	const minVersion = getMinNodeVersion(configuredVersion);
	if (!minVersion) {
		return true;
	}

	return semver.gte(minVersion, globalInfo.supportedSince);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Disallow using ECMAScript built-in globals not supported in the configured Node.js version.",
		id: "unsupportedGlobals",
		presets: ["logical"],
	},
	messages: {
		unsupportedGlobal: {
			primary:
				'"{{ name }}" is not supported until Node.js {{ supportedSince }}. The configured version range is "{{ configuredVersion }}".',
			secondary: [
				"Using features not supported by your target Node.js version will cause runtime errors.",
				"Consider upgrading the minimum Node.js version in package.json or using a polyfill.",
			],
			suggestions: [
				"Update the engines.node field in package.json to require a newer version.",
				"Use a polyfill or alternative implementation for older Node.js versions.",
			],
		},
	},
	setup(context) {
		let configuredVersion: string | null | undefined;

		return {
			dependencies: ["package.json"],
			visitors: {
				Identifier(node, { sourceFile }) {
					const globalName = node.text;
					const globalInfo = unsupportedGlobals[globalName];
					if (!globalInfo) {
						return;
					}

					// Skip if this is not a standalone reference (e.g., property access)
					if (
						node.parent.kind === SyntaxKind.PropertyAccessExpression &&
						node.parent.name === node
					) {
						return;
					}

					// Skip if this is being declared
					if (
						node.parent.kind === SyntaxKind.VariableDeclaration &&
						node.parent.name === node
					) {
						return;
					}

					// Skip if this is a type reference
					if (node.parent.kind === SyntaxKind.TypeReference) {
						return;
					}

					// Lazily fetch the configured version
					if (configuredVersion === undefined) {
						const fileDirectory = nodePath.dirname(sourceFile.fileName);
						const packageJson = findPackageJson(fileDirectory);
						configuredVersion = packageJson?.engines?.node ?? null;
					}

					if (!configuredVersion) {
						return;
					}

					if (!isGlobalSupported(globalInfo, configuredVersion)) {
						context.report({
							data: {
								configuredVersion,
								name: globalInfo.name,
								supportedSince: globalInfo.supportedSince,
							},
							message: "unsupportedGlobal",
							range: getTSNodeRange(node, sourceFile),
						});
					}
				},
			},
		};
	},
});
