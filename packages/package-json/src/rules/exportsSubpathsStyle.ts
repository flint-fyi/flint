import { SyntaxKind } from "typescript";
import { z } from "zod/v4";

import { getJsonNodeRange, jsonLanguage } from "@flint.fyi/json-language";
import type { AST } from "@flint.fyi/typescript-language";

import { getPackagePropertyOfName } from "../getPackagePropertyOfName.ts";
import { ruleCreator } from "../ruleCreator.ts";

function getSingleRootSubpath(node: AST.ObjectLiteralExpression) {
	if (node.properties.length !== 1) {
		return undefined;
	}

	const [property] = node.properties;

	return property?.kind === SyntaxKind.PropertyAssignment &&
		property.name.kind === SyntaxKind.StringLiteral &&
		property.name.text === "." &&
		(property.initializer.kind === SyntaxKind.StringLiteral ||
			property.initializer.kind === SyntaxKind.ObjectLiteralExpression)
		? property
		: undefined;
}

function isImplicitRootExportsObject(node: AST.ObjectLiteralExpression) {
	return (
		node.properties.length &&
		node.properties.every(
			(property) =>
				property.kind === SyntaxKind.PropertyAssignment &&
				property.name.kind === SyntaxKind.StringLiteral &&
				!property.name.text.startsWith("."),
		)
	);
}

// flint-disable-next-line ts/deprecated
// eslint-disable-next-line @typescript-eslint/no-deprecated
export default ruleCreator.createRule(jsonLanguage, {
	about: {
		description:
			"Enforce consistent root `exports` subpath style in package.json.",
		id: "exportsSubpathsStyle",
		presets: ["stylistic"],
	},
	messages: {
		preferExplicit: {
			primary:
				'Prefer the explicit "." subpath form for a single package export.',
			secondary: [
				'Using "." keeps the top-level exports shape consistent when more subpaths are added later.',
			],
			suggestions: ['Wrap the root export in a "." subpath.'],
		},
		preferImplicit: {
			primary: "Prefer the implicit root form for a single package export.",
			secondary: [
				'The implicit root form avoids an extra "." wrapper when there are no other subpath exports.',
			],
			suggestions: ['Unwrap the "." subpath to the root export value.'],
		},
	},
	options: {
		prefer: z
			.enum(["explicit", "implicit"])
			.default("explicit")
			.describe("Which root exports style to enforce."),
	},
	setup(context) {
		return {
			visitors: {
				JsonSourceFile(node, { options }) {
					const property = getPackagePropertyOfName(node, "exports");

					if (
						property?.kind !== SyntaxKind.PropertyAssignment ||
						property.name.kind !== SyntaxKind.StringLiteral
					) {
						return;
					}

					const initializer = property.initializer;
					const range = getJsonNodeRange(property.name, node);

					if (
						options.prefer === "explicit" &&
						(initializer.kind === SyntaxKind.StringLiteral ||
							(initializer.kind === SyntaxKind.ObjectLiteralExpression &&
								isImplicitRootExportsObject(initializer)))
					) {
						context.report({
							fix: {
								range: getJsonNodeRange(initializer, node),
								text: `{ ".": ${initializer.getText(node)} }`,
							},
							message: "preferExplicit",
							range,
						});

						return;
					}

					if (
						options.prefer !== "implicit" ||
						initializer.kind !== SyntaxKind.ObjectLiteralExpression
					) {
						return;
					}
					const rootSubpath = getSingleRootSubpath(initializer);

					if (!rootSubpath) {
						return;
					}

					context.report({
						fix: {
							range: getJsonNodeRange(initializer, node),
							text: rootSubpath.initializer.getText(node),
						},
						message: "preferImplicit",
						range,
					});
				},
			},
		};
	},
});
