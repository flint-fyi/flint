import { SyntaxKind } from "typescript";

import { getJsonNodeRange, jsonLanguage } from "@flint.fyi/json-language";
import type { AST } from "@flint.fyi/typescript-language";

import { getPackagePropertiesLegacy } from "../getPackageProperties.ts";
import { removeArrayElementLegacy } from "../removeArrayElement.ts";
import { removeObjectPropertyLegacy } from "../removeObjectProperty.ts";
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

// flint-disable-next-line ts/deprecated
// eslint-disable-next-line @typescript-eslint/no-deprecated
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
				JsonSourceFile(node) {
					const dependencies = new Set<string>();
					const crossGroupDependencies: AST.ObjectLiteralExpression[] = [];

					function checkArrayDependencies(
						initializer: AST.ArrayLiteralExpression,
					) {
						const seen = new Set<string>();

						for (const element of initializer.elements.toReversed()) {
							if (element.kind !== SyntaxKind.StringLiteral) {
								continue;
							}

							if (!seen.has(element.text)) {
								seen.add(element.text);
								continue;
							}

							const { range, text } = removeArrayElementLegacy(
								node,
								element,
								initializer,
							);

							context.report({
								message: "duplicateDependency",
								range: getJsonNodeRange(element, node),
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

					function checkObjectDependencies(
						initializer: AST.ObjectLiteralExpression,
					) {
						const seen = new Set<string>();

						for (const dependency of initializer.properties.toReversed()) {
							if (
								dependency.kind !== SyntaxKind.PropertyAssignment ||
								dependency.name.kind !== SyntaxKind.StringLiteral
							) {
								continue;
							}

							const dependencyName = dependency.name;

							if (!seen.has(dependencyName.text)) {
								seen.add(dependencyName.text);
								continue;
							}

							const { range, text } = removeObjectPropertyLegacy(
								node,
								dependency,
								initializer,
							);

							context.report({
								message: "duplicateDependency",
								range: getJsonNodeRange(dependencyName, node),
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
							for (const dependency of dependencyGroup.properties) {
								if (
									dependency.kind !== SyntaxKind.PropertyAssignment ||
									dependency.name.kind !== SyntaxKind.StringLiteral ||
									!dependencies.has(dependency.name.text)
								) {
									continue;
								}

								const { range, text } = removeObjectPropertyLegacy(
									node,
									dependency,
									dependencyGroup,
								);

								context.report({
									message: "crossGroupDuplicate",
									range: getJsonNodeRange(dependency.name, node),
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

					for (const property of getPackagePropertiesLegacy(node) ?? []) {
						if (
							property.kind !== SyntaxKind.PropertyAssignment ||
							property.name.kind !== SyntaxKind.StringLiteral ||
							!dependencyPropertyNames.has(property.name.text)
						) {
							continue;
						}

						const initializer = property.initializer;

						if (initializer.kind === SyntaxKind.ArrayLiteralExpression) {
							checkArrayDependencies(initializer);
							continue;
						}

						if (initializer.kind === SyntaxKind.ObjectLiteralExpression) {
							checkObjectDependencies(initializer);

							const groupName = property.name.text;

							if (groupName === "dependencies") {
								for (const dependency of initializer.properties) {
									if (
										dependency.kind !== SyntaxKind.PropertyAssignment ||
										dependency.name.kind !== SyntaxKind.StringLiteral
									) {
										continue;
									}

									dependencies.add(dependency.name.text);
								}
							} else if (crossGroupDependencyPropertyNames.has(groupName)) {
								crossGroupDependencies.push(initializer);
							}
						}
					}

					checkCrossGroupDependencies();
				},
			},
		};
	},
});
