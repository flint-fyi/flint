import { astroLanguage } from "@flint.fyi/astro-language";
import { getTSNodeRange } from "@flint.fyi/typescript-language";
import ts, { SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function typeCanBeClientOnlyValue(
	type: ts.Type,
	typeChecker: ts.TypeChecker,
): boolean {
	if (
		type.flags &
		(ts.TypeFlags.Any | ts.TypeFlags.StringLike | ts.TypeFlags.Unknown)
	) {
		return true;
	}

	if (type.isUnionOrIntersection()) {
		return type.types.some((childType) =>
			typeCanBeClientOnlyValue(childType, typeChecker),
		);
	}

	const constraint = typeChecker.getBaseConstraintOfType(type);
	if (constraint && constraint !== type) {
		return typeCanBeClientOnlyValue(constraint, typeChecker);
	}

	const apparentType = typeChecker.getApparentType(type);
	if (apparentType !== type) {
		return typeCanBeClientOnlyValue(apparentType, typeChecker);
	}

	return false;
}

export default ruleCreator.createRule(astroLanguage, {
	about: {
		description:
			"Reports `client:only` directives without a value, or with a value whose type cannot be a renderer hint string.",
		id: "clientOnlyDirectiveValues",
		presets: ["logical"],
	},
	messages: {
		invalidValue: {
			primary:
				'`client:only` values should be typed so they could resolve to a renderer hint string such as `"react"` or `"svelte"`.',
			secondary: [
				"Astro expects a string renderer hint to know which client runtime should hydrate the component.",
				"Types such as `number` can never provide that hint, so they are always incorrect here.",
			],
			suggestions: [
				"Use a string value or a type that could evaluate to a string renderer hint.",
				"If the value is computed elsewhere, annotate or refine it so TypeScript knows it can be a string.",
			],
		},
		missingValue: {
			primary:
				"`client:only` directives need a value so Astro knows which renderer to load.",
			secondary: [
				'Astro expects a renderer hint such as `"react"` or `"svelte"` on `client:only`.',
				"Without a value, the component cannot declare which client runtime should hydrate it.",
			],
			suggestions: [
				"Add a renderer hint string or an expression whose type could be a string.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				JsxAttribute(node, { sourceFile, typeChecker }) {
					if (
						node.name.kind !== SyntaxKind.JsxNamespacedName ||
						node.name.namespace.text !== "client" ||
						node.name.name.text !== "only"
					) {
						return;
					}

					if (!node.initializer) {
						context.report({
							message: "missingValue",
							range: getTSNodeRange(node.name, sourceFile),
						});
						return;
					}

					if (node.initializer.kind === SyntaxKind.StringLiteral) {
						return;
					}

					if (
						node.initializer.kind === SyntaxKind.JsxExpression &&
						node.initializer.expression &&
						typeCanBeClientOnlyValue(
							typeChecker.getTypeAtLocation(node.initializer.expression),
							typeChecker,
						)
					) {
						return;
					}

					context.report({
						message: "invalidValue",
						range: getTSNodeRange(node.name, sourceFile),
					});
				},
			},
		};
	},
});
