import * as tsutils from "ts-api-utils";
import { SyntaxKind } from "typescript";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
	type Checker,
} from "@flint.fyi/typescript-language";

import { findProperty } from "../utils/findProperty.ts";
import { isRuleCreatorCreateRule } from "../utils/ruleCreatorHelpers.ts";
import { ruleCreator } from "./ruleCreator.ts";

function getCreatorPresets(
	creator: AST.LeftHandSideExpression,
	typeChecker: Checker,
): Set<string> {
	const creatorType = typeChecker.getTypeAtLocation(creator);
	if (!tsutils.isTypeReference(creatorType)) {
		return new Set();
	}

	const [presetType] = typeChecker.getTypeArguments(creatorType);
	if (!presetType) {
		return new Set();
	}

	return new Set(
		tsutils
			.unionConstituents(presetType)
			.flatMap((type) => (type.isStringLiteral() ? [type.value] : [])),
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports rules in a base preset that are missing from that preset's `Strict` variant.",
		id: "strictPresetSupersets",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		missingStrictPreset: {
			primary:
				"This rule is in the '{{ preset }}' preset but not the '{{ preset }}Strict' preset.",
			secondary: [
				"Each `*Strict` preset is documented as a superset of its base preset.",
				"Users who enable only the strict preset would otherwise not receive this rule.",
			],
			suggestions: ["Add '{{ preset }}Strict' to the rule's presets."],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression(node, { sourceFile, typeChecker }) {
					if (
						node.expression.kind !== SyntaxKind.PropertyAccessExpression ||
						!isRuleCreatorCreateRule(node, typeChecker)
					) {
						return;
					}

					const definition = node.arguments[1];
					if (definition?.kind !== SyntaxKind.ObjectLiteralExpression) {
						return;
					}

					const about = findProperty(
						definition.properties,
						"about",
						(node): node is AST.ObjectLiteralExpression =>
							node.kind === SyntaxKind.ObjectLiteralExpression,
					);
					if (!about) {
						return;
					}

					const presets = findProperty(
						about.properties,
						"presets",
						(node): node is AST.ArrayLiteralExpression =>
							node.kind === SyntaxKind.ArrayLiteralExpression,
					);
					if (!presets) {
						return;
					}

					const availablePresets = getCreatorPresets(
						node.expression.expression,
						typeChecker,
					);
					const presetNames = new Set(
						presets.elements
							.filter((element) => element.kind === SyntaxKind.StringLiteral)
							.map((element) => element.text),
					);

					for (const element of presets.elements) {
						if (element.kind !== SyntaxKind.StringLiteral) {
							continue;
						}

						const strictPreset = `${element.text}Strict`;
						if (
							!availablePresets.has(strictPreset) ||
							presetNames.has(strictPreset)
						) {
							continue;
						}

						context.report({
							data: { preset: element.text },
							message: "missingStrictPreset",
							range: getTSNodeRange(element, sourceFile),
							suggestions: [
								{
									id: "addStrictPreset",
									range: { begin: element.getEnd(), end: element.getEnd() },
									text: `, "${strictPreset}"`,
								},
							],
						});
					}
				},
			},
		};
	},
});
