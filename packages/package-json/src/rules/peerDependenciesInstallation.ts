import { getJsonNodeRange, jsonLanguage } from "@flint.fyi/json-language/new";

import { getPackagePropertiesOfNames } from "../getPackagePropertiesOfNames.ts";
import { ruleCreator } from "../ruleCreator.ts";

export default ruleCreator.createRule(jsonLanguage, {
	about: {
		description:
			"Enforces that peer dependencies are installed through devDependencies.",
		id: "peerDependenciesInstallation",
		presets: ["logical"],
	},
	messages: {
		missingDevDependency: {
			primary:
				"Peer dependency `{{ name }}` should also be declared in devDependencies.",
			secondary: [
				"`peerDependencies` declares the version range consumers must provide, but local development still needs an installed copy.",
			],
			suggestions: ["Add `{{ name }}` to devDependencies."],
		},
	},
	setup(context) {
		return {
			visitors: {
				Document(node) {
					const { devDependencies, peerDependencies } =
						getPackagePropertiesOfNames(node, [
							"peerDependencies",
							"devDependencies",
						]);

					if (peerDependencies?.value.type !== "Object") {
						return;
					}

					const devDependencyNames = new Set<string>();
					if (devDependencies?.value.type === "Object") {
						for (const dependencyNode of devDependencies.value.members) {
							if (dependencyNode.name.type === "String") {
								devDependencyNames.add(dependencyNode.name.value);
							}
						}
					}

					for (const dependency of peerDependencies.value.members) {
						if (
							dependency.name.type === "String" &&
							!devDependencyNames.has(dependency.name.value)
						) {
							context.report({
								data: { name: dependency.name.value },
								message: "missingDevDependency",
								range: getJsonNodeRange(dependency.name),
							});
						}
					}
				},
			},
		};
	},
});
