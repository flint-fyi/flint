import { getJsonNodeRange, jsonLanguage } from "@flint.fyi/json-language";
import { SyntaxKind } from "typescript";

import { getPackagePropertyOfName } from "../getPackagePropertyOfName.ts";
import { removeObjectProperty } from "../removeObjectProperty.ts";
import { ruleCreator } from "../ruleCreator.ts";

export default ruleCreator.createRule(jsonLanguage, {
	about: {
		description:
			"Enforces that any dependencies declared in `peerDependenciesMeta` are also defined in the package's `peerDependencies`.",
		id: "peerDependenciesMetaRelationship",
		presets: ["logical"],
	},
	messages: {
		unnecessaryPeerDependency: {
			primary:
				"Dependency '{{ dependencyName }}' is declared in `peerDependenciesMeta` but not in `peerDependencies`.",
			secondary: [
				"Dependencies declared in `peerDependenciesMeta` but not in `peerDependencies` have no effect and may indicate a mistake or outdated configuration.",
			],
			suggestions: ["Remove dependency from `peerDependenciesMeta`."],
		},
	},
	setup(context) {
		return {
			visitors: {
				JsonSourceFile(node, { sourceFile }) {
					const peerDependenciesMeta = getPackagePropertyOfName(
						node,
						"peerDependenciesMeta",
					);

					// Bail early if there are no peerDependenciesMeta or if it's the wrong shape
					if (
						peerDependenciesMeta?.kind !== SyntaxKind.PropertyAssignment ||
						peerDependenciesMeta.initializer.kind !==
							SyntaxKind.ObjectLiteralExpression
					) {
						return;
					}

					const peerDependencies = getPackagePropertyOfName(
						node,
						"peerDependencies",
					);

					// Collect the set of dependency names declared in peerDependencies
					const declaredPeerDependencyNames = new Set<string>();
					if (
						peerDependencies?.kind === SyntaxKind.PropertyAssignment &&
						peerDependencies.initializer.kind ===
							SyntaxKind.ObjectLiteralExpression
					) {
						for (const element of peerDependencies.initializer.properties) {
							if (
								element.kind === SyntaxKind.PropertyAssignment &&
								element.name.kind === SyntaxKind.StringLiteral
							) {
								declaredPeerDependencyNames.add(element.name.text);
							}
						}
					}

					// Check all dependencies declared in peerDependenciesMeta to ensure they are also declared in peerDependencies
					for (const element of peerDependenciesMeta.initializer.properties) {
						if (
							element.kind === SyntaxKind.PropertyAssignment &&
							element.name.kind === SyntaxKind.StringLiteral
						) {
							const dependencyName = element.name.text;

							if (!declaredPeerDependencyNames.has(dependencyName)) {
								const { range, text } = removeObjectProperty(
									sourceFile,
									element,
									peerDependenciesMeta.initializer,
								);
								context.report({
									data: { dependencyName },
									message: "unnecessaryPeerDependency",
									range: getJsonNodeRange(element.name, sourceFile),
									suggestions: [
										{
											id: "removeUnnecessaryPeerDependencyMeta",
											range,
											text,
										},
									],
								});
							}
						}
					}
				},
			},
		};
	},
});
