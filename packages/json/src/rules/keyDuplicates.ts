import ts from "typescript";
import z from "zod";

import { jsonLanguage } from "../language.ts";

export default jsonLanguage.createRule({
	about: {
		description:
			"Reports unnecessary duplicate keys that override previous values.",
		id: "keyDuplicates",
		preset: "logical",
	},
	messages: {
		duplicateKey: {
			primary:
				"This key is made redundant by an identical key later in the object.",
			secondary: [
				"Although JSON technically allows duplicate keys, using them is at best confusing.",
				"Most JSON parsers will ignore all but the last value for a given key.",
				"It's generally best to ensure that each key in a JSON object is unique.",
			],
			suggestions: [
				"If both values are meant to exist, change one of the keys to be different.",
				"If only the last value is meant to exist, you can remove any prior values.",
			],
		},
	},
	options: {
		allowKeys: z
			.array(z.string())
			.default([])
			.describe("Keys to allow duplicates under."),
	},
	setup(context) {
		return {
			visitors: {
				ObjectLiteralExpression(node, { options, sourceFile }) {
					const seenKeys = new Set<string>();

					for (const property of node.properties.toReversed()) {
						if (
							!ts.isPropertyAssignment(property) ||
							!ts.isStringLiteral(property.name)
						) {
							continue;
						}

						const key = property.name.text;
						if (options.allowKeys.includes(key)) {
							continue;
						}

						const existingNode = seenKeys.has(key);

						if (!existingNode) {
							seenKeys.add(key);
							continue;
						}

						context.report({
							message: "duplicateKey",
							range: {
								begin: property.name.getStart(sourceFile),
								end: property.name.end,
							},
						});
					}
				},
			},
		};
	},
});
