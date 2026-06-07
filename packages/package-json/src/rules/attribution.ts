import { SyntaxKind } from "typescript";
import { z } from "zod/v4";

import { getJsonNodeRange, jsonLanguage } from "@flint.fyi/json-language";

import { getPackagePropertiesOfNames } from "../getPackagePropertiesOfNames.ts";
import { ruleCreator } from "../ruleCreator.ts";

// flint-disable-next-line ts/deprecated
// eslint-disable-next-line @typescript-eslint/no-deprecated
export default ruleCreator.createRule(jsonLanguage, {
	about: {
		description:
			"Enforces that package.json declares author or contributor attribution.",
		id: "attribution",
		presets: ["logical"],
	},
	messages: {
		emptyContributors: {
			primary: "Contributors are expected to include at least one entry.",
			secondary: [
				"An empty contributors array does not provide package attribution.",
			],
			suggestions: ["Add contributor entries to contributors."],
		},
		missing: {
			primary:
				"Package attribution is expected to include an author or contributors.",
			secondary: [
				"Package attribution identifies the people responsible for maintaining or contributing to the package.",
			],
			suggestions: ["Add author or contributors attribution."],
		},
		missingContributors: {
			primary: "Package attribution is expected to include contributors.",
			secondary: [
				"This configuration expects all package attribution to live in contributors.",
			],
			suggestions: ["Add a contributors entry."],
		},
		preferContributorsOnly: {
			primary: "Prefer using contributors over author for package attribution.",
			secondary: [
				"This configuration expects all package attribution to live in contributors.",
			],
			suggestions: ["Remove author or move attribution into contributors."],
		},
	},
	options: {
		ignorePrivate: z
			.boolean()
			.default(true)
			.describe(
				"Whether attribution requirements should be skipped when the package's `private` property is `true`.",
			),
		preferContributorsOnly: z
			.boolean()
			.default(false)
			.describe(
				"Whether only contributors should be accepted for package attribution.",
			),
	},
	setup(context) {
		return {
			visitors: {
				JsonSourceFile(node, { options }) {
					const {
						author,
						contributors,
						private: privateNode,
					} = getPackagePropertiesOfNames(node, [
						"private",
						"author",
						"contributors",
					]);
					if (
						options.ignorePrivate &&
						privateNode?.kind === SyntaxKind.PropertyAssignment &&
						privateNode.initializer.kind === SyntaxKind.TrueKeyword
					) {
						return;
					}

					if (
						options.preferContributorsOnly &&
						author?.kind === SyntaxKind.PropertyAssignment &&
						author.name.kind === SyntaxKind.StringLiteral
					) {
						context.report({
							message: "preferContributorsOnly",
							range: getJsonNodeRange(author.name, node),
						});
					}

					if (
						contributors?.kind === SyntaxKind.PropertyAssignment &&
						contributors.initializer.kind ===
							SyntaxKind.ArrayLiteralExpression &&
						!contributors.initializer.elements.length
					) {
						context.report({
							message: "emptyContributors",
							range: getJsonNodeRange(contributors.initializer, node),
						});
					}

					if (author || contributors) {
						return;
					}

					context.report({
						message: options.preferContributorsOnly
							? "missingContributors"
							: "missing",
						range: { begin: 0, end: 1 },
					});
				},
			},
		};
	},
});
