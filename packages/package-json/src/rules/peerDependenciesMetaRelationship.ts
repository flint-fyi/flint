import { getNodeRange, jsonLanguage } from "@flint.fyi/json-language";

import { getPackagePropertiesOfNames } from "../getPackagePropertiesOfNames.ts";
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
				Document(node) {
					const { peerDependencies, peerDependenciesMeta } =
						getPackagePropertiesOfNames(node, [
							"peerDependencies",
							"peerDependenciesMeta",
						]);

					// Bail early if there are no peerDependenciesMeta or if it's the wrong shape
					if (peerDependenciesMeta?.value.type !== "Object") {
						return;
					}

					// Collect the set of dependency names declared in peerDependencies
					const declaredPeerDependencyNames = new Set<string>();
					if (peerDependencies?.value.type === "Object") {
						for (const element of peerDependencies.value.members) {
							if (element.name.type === "String") {
								declaredPeerDependencyNames.add(element.name.value);
							}
						}
					}

					// Check all dependencies declared in peerDependenciesMeta to ensure they are also declared in peerDependencies
					for (const element of peerDependenciesMeta.value.members) {
						if (element.name.type === "String") {
							const dependencyName = element.name.value;

							if (!declaredPeerDependencyNames.has(dependencyName)) {
								const { range, text } = removeObjectProperty(
									element,
									peerDependenciesMeta.value,
								);
								context.report({
									data: { dependencyName },
									message: "unnecessaryPeerDependency",
									range: getNodeRange(element.name),
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
