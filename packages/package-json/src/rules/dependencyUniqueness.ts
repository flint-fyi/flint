import type { ArrayNode, ObjectNode } from "@humanwhocodes/momoa";

import { getJsonNodeRange, jsonLanguage } from "@flint.fyi/json-language/new";

import { getPackageProperties } from "../getPackageProperties.ts";
import { removeArrayElement } from "../removeArrayElement.ts";
import { removeObjectProperty } from "../removeObjectProperty.ts";
import { ruleCreator } from "../ruleCreator.ts";

const dependencyPropertyNames = new Set([
	"bundledDependencies",
	"bundleDependencies",
	"dependencies",
	"devDependencies",
	"optionalDependencies",
	"overrides",
	"peerDependencies",
]);

const crossGroupDependencyPropertyNames = new Set([
	"devDependencies",
	"peerDependencies",
]);

export default ruleCreator.createRule(jsonLanguage, {
	about: {
		description:
			"Reports dependency names that are declared more than once in package.json.",
		id: "dependencyUniqueness",
		presets: ["logical"],
	},
	messages: {
		crossGroupDuplicate: {
			primary:
				"This dependency is also declared in dependencies, which this rule treats as redundant here.",
			secondary: [
				"This rule prefers not to repeat dependency names from dependencies in devDependencies or peerDependencies.",
			],
			suggestions: ["Remove the redundant dependency entry."],
		},
		duplicateDependency: {
			primary:
				"This dependency is overridden by a duplicate entry later in the same dependency collection.",
			secondary: [
				"Repeating a dependency name in the same package.json collection makes the earlier entry ineffective.",
			],
			suggestions: ["Remove the earlier duplicate dependency entry."],
		},
	},
	setup(context) {
		return {
			visitors: {
				Document(node) {
					const dependencies = new Set<string>();
					const crossGroupDependencies: ObjectNode[] = [];

					function checkArrayDependencies(initializer: ArrayNode) {
						const seen = new Set<string>();

						for (const element of initializer.elements.toReversed()) {
							const elementValue = element.value;
							if (elementValue.type !== "String") {
								continue;
							}

							if (!seen.has(elementValue.value)) {
								seen.add(elementValue.value);
								continue;
							}

							const { range, text } = removeArrayElement(element, initializer);

							context.report({
								message: "duplicateDependency",
								range: getJsonNodeRange(elementValue),
								suggestions: [
									{
										id: "removeDependency",
										range,
										text,
									},
								],
							});
						}
					}

					function checkObjectDependencies(initializer: ObjectNode) {
						const seen = new Set<string>();

						for (const dependencyProperty of initializer.members.toReversed()) {
							const dependencyName = dependencyProperty.name;
							if (dependencyName.type !== "String") {
								continue;
							}

							if (!seen.has(dependencyName.value)) {
								seen.add(dependencyName.value);
								continue;
							}

							const { range, text } = removeObjectProperty(
								dependencyProperty,
								initializer,
							);

							context.report({
								message: "duplicateDependency",
								range: getJsonNodeRange(dependencyName),
								suggestions: [
									{
										id: "removeDependency",
										range,
										text,
									},
								],
							});
						}
					}

					function checkCrossGroupDependencies() {
						for (const dependencyGroup of crossGroupDependencies) {
							for (const dependency of dependencyGroup.members) {
								if (
									dependency.name.type !== "String" ||
									!dependencies.has(dependency.name.value)
								) {
									continue;
								}

								const { range, text } = removeObjectProperty(
									dependency,
									dependencyGroup,
								);

								context.report({
									message: "crossGroupDuplicate",
									range: getJsonNodeRange(dependency.name),
									suggestions: [
										{
											id: "removeDependency",
											range,
											text,
										},
									],
								});
							}
						}
					}

					for (const property of getPackageProperties(node) ?? []) {
						if (
							property.name.type !== "String" ||
							!dependencyPropertyNames.has(property.name.value)
						) {
							continue;
						}

						const propertyValue = property.value;

						if (propertyValue.type === "Array") {
							checkArrayDependencies(propertyValue);
							continue;
						}

						if (propertyValue.type === "Object") {
							checkObjectDependencies(propertyValue);

							const groupName = property.name.value;

							if (groupName === "dependencies") {
								for (const dependency of propertyValue.members) {
									if (dependency.name.type !== "String") {
										continue;
									}

									dependencies.add(dependency.name.value);
								}
							} else if (crossGroupDependencyPropertyNames.has(groupName)) {
								crossGroupDependencies.push(propertyValue);
							}
						}
					}

					checkCrossGroupDependencies();
				},
			},
		};
	},
});
