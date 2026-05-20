import { getJsonNodeRange, jsonLanguage } from "@flint.fyi/json-language";
import { SyntaxKind } from "typescript";

import { getPackagePropertyOfName } from "../getPackagePropertyOfName.ts";
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
				JsonSourceFile(node, { sourceFile }) {
					const peerDependencies = getPackagePropertyOfName(
						node,
						"peerDependencies",
					);
					if (
						peerDependencies?.kind !== SyntaxKind.PropertyAssignment ||
						peerDependencies.initializer.kind !==
							SyntaxKind.ObjectLiteralExpression
					) {
						return;
					}

					const devDependencyNames = new Set<string>();
					const devDependencies = getPackagePropertyOfName(
						node,
						"devDependencies",
					);
					if (
						devDependencies?.kind === SyntaxKind.PropertyAssignment &&
						devDependencies.initializer.kind ===
							SyntaxKind.ObjectLiteralExpression
					) {
						for (const dependency of devDependencies.initializer.properties) {
							if (
								dependency.kind === SyntaxKind.PropertyAssignment &&
								dependency.name.kind === SyntaxKind.StringLiteral
							) {
								devDependencyNames.add(dependency.name.text);
							}
						}
					}

					for (const dependency of peerDependencies.initializer.properties) {
						if (
							dependency.kind === SyntaxKind.PropertyAssignment &&
							dependency.name.kind === SyntaxKind.StringLiteral &&
							!devDependencyNames.has(dependency.name.text)
						) {
							context.report({
								data: { name: dependency.name.text },
								message: "missingDevDependency",
								range: getJsonNodeRange(dependency.name, sourceFile),
							});
						}
					}
				},
			},
		};
	},
});
