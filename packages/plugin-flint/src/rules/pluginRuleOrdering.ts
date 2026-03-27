import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts, { SyntaxKind } from "typescript";

import { findProperty } from "../utils/findProperty.ts";
import { ruleCreator } from "./ruleCreator.ts";

function compareRuleNames(left: string, right: string) {
	const leftLower = left.toLowerCase();
	const rightLower = right.toLowerCase();

	if (leftLower === rightLower) {
		if (left === right) {
			return 0;
		}

		return left < right ? -1 : 1;
	}

	return leftLower < rightLower ? -1 : 1;
}

function hasCommentsInArray(
	array: AST.ArrayLiteralExpression,
	sourceFile: AST.SourceFile,
) {
	const arrayText = sourceFile.text.slice(
		array.getStart(sourceFile),
		array.getEnd(),
	);

	return arrayText.includes("//") || arrayText.includes("/*");
}

// TODO: Maybe we will have a function to check if a symbol is from Flint in the future
function isCreatePluginCall(
	node: AST.CallExpression,
	typeChecker: ts.TypeChecker,
) {
	if (node.expression.kind !== SyntaxKind.Identifier) {
		return false;
	}

	const symbol = typeChecker.getSymbolAtLocation(node.expression);
	if (!symbol) {
		return false;
	}

	const resolvedSymbol =
		symbol.flags & ts.SymbolFlags.Alias
			? typeChecker.getAliasedSymbol(symbol)
			: symbol;

	if (resolvedSymbol.getName() !== "createPlugin") {
		return false;
	}

	return resolvedSymbol.getDeclarations()?.some((declaration) => {
		const fileName = declaration.getSourceFile().fileName.replaceAll("\\", "/");

		return (
			fileName.includes("/core/") &&
			/plugins\/createPlugin\.(?:d\.)?[cm]?[jt]s$/.test(fileName)
		);
	});
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports Flint plugin `rules` arrays that are not sorted alphabetically.",
		id: "pluginRuleOrdering",
		presets: ["stylisticStrict"],
	},
	messages: {
		pluginRuleOrdering: {
			primary: "Flint plugin rules should be listed in alphabetical order.",
			secondary: [
				"Keeping plugin rule arrays sorted makes them easier to scan and update.",
				"This rule only checks `createPlugin({ rules: [...] })` arrays made of plain identifiers.",
			],
			suggestions: ["Sort the rules array alphabetically."],
		},
	},
	setup(context) {
		function checkRulesArray(
			array: AST.ArrayLiteralExpression,
			sourceFile: AST.SourceFile,
		) {
			// TODO: Skip arrays containing spreads or other non-Identifier elements.
			const elements = array.elements.filter(
				(element): element is AST.Identifier =>
					element.kind === SyntaxKind.Identifier,
			);

			const firstElement = elements[0];
			const lastElement = elements.at(-1);
			if (!firstElement || !lastElement || firstElement === lastElement) {
				return;
			}

			const names = elements.map((element) => element.text);
			const sorted = [...names].toSorted(compareRuleNames);
			const firstOutOfOrderIndex = names.findIndex(
				(name, index) => name !== sorted[index],
			);
			if (firstOutOfOrderIndex === -1) {
				return;
			}

			const firstOutOfOrderElement = elements[firstOutOfOrderIndex];
			if (!firstOutOfOrderElement) {
				return;
			}

			const sortedElements = [...elements].sort((a, b) =>
				compareRuleNames(a.text, b.text),
			);
			const fix = hasCommentsInArray(array, sourceFile)
				? undefined
				: [
						{
							range: {
								begin: firstElement.getStart(sourceFile),
								end: lastElement.getEnd(),
							},
							text: sortedElements
								.map((sorted, index) => {
									const next = elements[index + 1];
									const current = elements[index];
									if (!current || !next) {
										return sorted.text;
									}

									return (
										sorted.text +
										sourceFile.text.slice(
											current.getEnd(),
											next.getStart(sourceFile),
										)
									);
								})
								.join(""),
						},
					];

			context.report({
				fix,
				message: "pluginRuleOrdering",
				range: getTSNodeRange(firstOutOfOrderElement, sourceFile),
			});
		}

		return {
			visitors: {
				CallExpression(node, { sourceFile, typeChecker }) {
					if (!isCreatePluginCall(node, typeChecker)) {
						return;
					}

					const options = node.arguments[0];
					if (options?.kind !== SyntaxKind.ObjectLiteralExpression) {
						return;
					}

					const rulesProperty = findProperty(
						options.properties,
						"rules",
						(node): node is AST.ArrayLiteralExpression =>
							node.kind === SyntaxKind.ArrayLiteralExpression,
					);

					if (!rulesProperty) {
						return;
					}

					checkRulesArray(rulesProperty, sourceFile);
				},
			},
		};
	},
});
