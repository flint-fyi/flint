import type { ObjectNode } from "@humanwhocodes/momoa";
import { z } from "zod/v4";

import {
	getNodeRange,
	getNodeText,
	jsonLanguage,
} from "@flint.fyi/json-language";

import { getPackagePropertyOfName } from "../getPackagePropertyOfName.ts";
import { ruleCreator } from "../ruleCreator.ts";

function getSingleRootSubpath(objectNode: ObjectNode) {
	if (objectNode.members.length !== 1) {
		return undefined;
	}

	const [property] = objectNode.members;

	return property?.name.type === "String" &&
		property.name.value === "." &&
		(property.value.type === "String" || property.value.type === "Object")
		? property
		: undefined;
}

function isImplicitRootExportsObject(objectNode: ObjectNode) {
	return (
		objectNode.members.length &&
		objectNode.members.every(
			(property) =>
				property.name.type === "String" && !property.name.value.startsWith("."),
		)
	);
}

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
				Document(node, { options, sourceText }) {
					const property = getPackagePropertyOfName(node, "exports");

					if (property?.name.type !== "String") {
						return;
					}

					const range = getNodeRange(property.name);

					const propertyValue = property.value;

					if (
						options.prefer === "explicit" &&
						(propertyValue.type === "String" ||
							(propertyValue.type === "Object" &&
								isImplicitRootExportsObject(propertyValue)))
					) {
						context.report({
							fix: {
								range: getNodeRange(propertyValue),
								text: `{ ".": ${getNodeText(propertyValue, sourceText)} }`,
							},
							message: "preferExplicit",
							range,
						});

						return;
					}

					if (
						options.prefer !== "implicit" ||
						propertyValue.type !== "Object"
					) {
						return;
					}
					const rootSubpath = getSingleRootSubpath(propertyValue);

					if (!rootSubpath) {
						return;
					}

					context.report({
						fix: {
							range: getNodeRange(propertyValue),
							text: getNodeText(rootSubpath.value, sourceText),
						},
						message: "preferImplicit",
						range,
					});
				},
			},
		};
	},
});
