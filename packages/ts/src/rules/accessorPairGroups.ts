import {
	type AST,
	getTSNodeRange,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import {
	type AccessorPair,
	collectAccessorPairs,
} from "./utils/collectAccessorPairs.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports getter and setter accessors for the same property that are not adjacent.",
		id: "accessorPairGroups",
		presets: ["stylistic"],
	},
	messages: {
		notGrouped: {
			primary:
				"Getter and setter for `{{ name }}` should be defined adjacent to each other.",
			secondary: [
				"Grouping getters and setters together improves code readability.",
				"It makes it easier to understand how a property is accessed and modified.",
			],
			suggestions: ["Move the getter and setter to be adjacent to each other."],
		},
	},
	setup(context) {
		function checkPairs(
			pairs: Map<string, AccessorPair>,
			{ sourceFile }: TypeScriptFileServices,
		) {
			for (const [name, pair] of pairs) {
				if (!pair.getter || !pair.setter) {
					continue;
				}

				const getterIndex = pair.getter.index;
				const setterIndex = pair.setter.index;

				if (Math.abs(getterIndex - setterIndex) !== 1) {
					const secondAccessor =
						getterIndex < setterIndex ? pair.setter.node : pair.getter.node;

					context.report({
						data: { name },
						message: "notGrouped",
						range: getTSNodeRange(secondAccessor.name, sourceFile),
					});
				}
			}
		}

		function checkClassLike(
			node: AST.ClassDeclaration | AST.ClassExpression,
			services: TypeScriptFileServices,
		) {
			const pairs = collectAccessorPairs(node.members, services.sourceFile);
			checkPairs(pairs, services);
		}

		function checkObjectLiteral(
			node: AST.ObjectLiteralExpression,
			services: TypeScriptFileServices,
		) {
			const pairs = collectAccessorPairs(node.properties, services.sourceFile);
			checkPairs(pairs, services);
		}

		return {
			visitors: {
				ClassDeclaration: checkClassLike,
				ClassExpression: checkClassLike,
				ObjectLiteralExpression: checkObjectLiteral,
			},
		};
	},
});
