import { getTSNodeRange, typescriptLanguage } from "@flint.fyi/ts";
import { parseJsonSafe } from "@flint.fyi/utils";
import * as fsSync from "node:fs";
import * as nodePath from "node:path";
import semver from "semver";
import ts, { SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

interface PackageJson {
	engines?: {
		node?: string;
	};
}

interface SyntaxFeature {
	name: string;
	supportedSince: string;
}

const syntaxFeatures: Record<string, SyntaxFeature> = {
	asyncAwait: { name: "async/await", supportedSince: "7.6.0" },
	asyncIteration: {
		name: "async iteration (for-await-of)",
		supportedSince: "10.0.0",
	},
	classFields: { name: "class fields", supportedSince: "12.0.0" },
	classStaticBlocks: { name: "class static blocks", supportedSince: "16.11.0" },
	dynamicImport: { name: "dynamic import", supportedSince: "13.2.0" },
	logicalAssignment: {
		name: "logical assignment operators (&&=, ||=, ??=)",
		supportedSince: "15.0.0",
	},
	nullishCoalescing: {
		name: "nullish coalescing operator (??)",
		supportedSince: "14.0.0",
	},
	numericSeparators: { name: "numeric separators", supportedSince: "12.5.0" },
	optionalChaining: {
		name: "optional chaining (?.)",
		supportedSince: "14.0.0",
	},
	privateIdentifiers: {
		name: "private class members (#)",
		supportedSince: "12.0.0",
	},
	topLevelAwait: { name: "top-level await", supportedSince: "14.8.0" },
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

function hasNumericSeparator(text: string) {
	return text.includes("_");
}

function isFeatureSupported(
	feature: SyntaxFeature,
	configuredVersion: string | undefined,
) {
	if (!configuredVersion) {
		return true;
	}

	const minVersion = getMinNodeVersion(configuredVersion);
	if (!minVersion) {
		return true;
	}

	return semver.gte(minVersion, feature.supportedSince);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Disallow using ECMAScript syntax not supported in the configured Node.js version.",
		id: "unsupportedSyntax",
		presets: ["logical"],
	},
	messages: {
		unsupportedSyntax: {
			primary:
				'{{ name }} is not supported until Node.js {{ supportedSince }}. The configured version range is "{{ configuredVersion }}".',
			secondary: [
				"Using syntax not supported by your target Node.js version will cause syntax errors.",
				"Consider upgrading the minimum Node.js version in package.json.",
			],
			suggestions: [
				"Update the engines.node field in package.json to require a newer version.",
				"Use an alternative syntax supported by your target Node.js version.",
			],
		},
	},
	setup(context) {
		let configuredVersion: null | string | undefined;
		let supportedFeatures: Map<string, boolean> | undefined;

		function checkFeature(
			featureKey: string,
			node: ts.Node,
			sourceFile: ts.SourceFile,
		) {
			if (configuredVersion === undefined) {
				const fileDirectory = nodePath.dirname(sourceFile.fileName);
				const packageJson = findPackageJson(fileDirectory);
				configuredVersion = packageJson?.engines?.node ?? null;
				supportedFeatures = new Map();
			}

			if (!configuredVersion) {
				return;
			}

			let isSupported = supportedFeatures?.get(featureKey);
			if (isSupported === undefined) {
				const feature = syntaxFeatures[featureKey];
				isSupported = feature
					? isFeatureSupported(feature, configuredVersion)
					: true;
				supportedFeatures?.set(featureKey, isSupported);
			}

			if (!isSupported) {
				const feature = syntaxFeatures[featureKey];
				if (feature) {
					context.report({
						data: {
							configuredVersion,
							name: feature.name,
							supportedSince: feature.supportedSince,
						},
						message: "unsupportedSyntax",
						range: getTSNodeRange(node, sourceFile),
					});
				}
			}
		}

		return {
			dependencies: ["package.json"],
			visitors: {
				AwaitExpression(node, { sourceFile }) {
					// Check for top-level await - if inside a function, it's not top-level
					const enclosingFunction = ts.findAncestor(
						node,
						(ancestor) =>
							ancestor.kind === SyntaxKind.FunctionDeclaration ||
							ancestor.kind === SyntaxKind.FunctionExpression ||
							ancestor.kind === SyntaxKind.ArrowFunction ||
							ancestor.kind === SyntaxKind.MethodDeclaration,
					);
					if (!enclosingFunction) {
						checkFeature("topLevelAwait", node, sourceFile);
					}
				},
				BinaryExpression(node, { sourceFile }) {
					// Check for nullish coalescing
					if (node.operatorToken.kind === SyntaxKind.QuestionQuestionToken) {
						checkFeature("nullishCoalescing", node.operatorToken, sourceFile);
					}

					// Check for logical assignment operators
					if (
						node.operatorToken.kind ===
							SyntaxKind.AmpersandAmpersandEqualsToken ||
						node.operatorToken.kind === SyntaxKind.BarBarEqualsToken ||
						node.operatorToken.kind === SyntaxKind.QuestionQuestionEqualsToken
					) {
						checkFeature("logicalAssignment", node.operatorToken, sourceFile);
					}
				},
				CallExpression(node, { sourceFile }) {
					// Check for dynamic import
					if (node.expression.kind === SyntaxKind.ImportKeyword) {
						checkFeature("dynamicImport", node, sourceFile);
					}
				},
				ClassStaticBlockDeclaration(node, { sourceFile }) {
					checkFeature("classStaticBlocks", node, sourceFile);
				},
				ForOfStatement(node, { sourceFile }) {
					// Check for async iteration (for-await-of)
					if (node.awaitModifier) {
						checkFeature("asyncIteration", node.awaitModifier, sourceFile);
					}
				},
				FunctionDeclaration(node, { sourceFile }) {
					// Check for async functions
					if (
						node.modifiers?.some((mod) => mod.kind === SyntaxKind.AsyncKeyword)
					) {
						checkFeature("asyncAwait", node, sourceFile);
					}
				},
				MethodDeclaration(node, { sourceFile }) {
					if (
						node.modifiers?.some((mod) => mod.kind === SyntaxKind.AsyncKeyword)
					) {
						checkFeature("asyncAwait", node, sourceFile);
					}
				},
				NumericLiteral(node, { sourceFile }) {
					// Check for numeric separators
					if (hasNumericSeparator(node.getText(sourceFile))) {
						checkFeature("numericSeparators", node, sourceFile);
					}
				},
				PrivateIdentifier(node, { sourceFile }) {
					checkFeature("privateIdentifiers", node, sourceFile);
				},
				PropertyAccessExpression(node, { sourceFile }) {
					// Check for optional chaining
					if (node.questionDotToken) {
						checkFeature("optionalChaining", node.questionDotToken, sourceFile);
					}
				},
				PropertyDeclaration(node, { sourceFile }) {
					// Check for class fields (properties declared in class body)
					checkFeature("classFields", node, sourceFile);
				},
			},
		};
	},
});
