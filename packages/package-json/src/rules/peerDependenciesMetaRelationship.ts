import { SyntaxKind } from "typescript";

import { getJsonNodeRange, jsonLanguage } from "@flint.fyi/json-language";

import { getPackagePropertiesOfNamesLegacy } from "../getPackagePropertiesOfNames.ts";
import { removeObjectPropertyLegacy } from "../removeObjectProperty.ts";
import { ruleCreator } from "../ruleCreator.ts";

// flint-disable-next-line ts/deprecated
// eslint-disable-next-line @typescript-eslint/no-deprecated
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
				JsonSourceFile(node) {
					const { peerDependencies, peerDependenciesMeta } =
						getPackagePropertiesOfNamesLegacy(node, [
							"peerDependencies",
							"peerDependenciesMeta",
						]);

					// Bail early if there are no peerDependenciesMeta or if it's the wrong shape
					if (
						peerDependenciesMeta?.kind !== SyntaxKind.PropertyAssignment ||
						peerDependenciesMeta.initializer.kind !==
							SyntaxKind.ObjectLiteralExpression
					) {
						return;
					}

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
								const { range, text } = removeObjectPropertyLegacy(
									node,
									element,
									peerDependenciesMeta.initializer,
								);
								context.report({
									data: { dependencyName },
									message: "unnecessaryPeerDependency",
									range: getJsonNodeRange(element.name, node),
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
