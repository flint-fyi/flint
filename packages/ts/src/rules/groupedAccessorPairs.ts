import {
	type AST,
	getTSNodeRange,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

interface AccessorInfo {
	index: number;
	node: AST.GetAccessorDeclaration | AST.SetAccessorDeclaration;
}

interface AccessorPair {
	getter?: AccessorInfo;
	setter?: AccessorInfo;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports getter and setter accessors for the same property that are not adjacent.",
		id: "groupedAccessorPairs",
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
		function getPropertyName(
			accessor: AST.GetAccessorDeclaration | AST.SetAccessorDeclaration,
			sourceFile: AST.SourceFile,
		) {
			if (
				ts.isIdentifier(accessor.name) ||
				ts.isStringLiteral(accessor.name) ||
				ts.isNumericLiteral(accessor.name)
			) {
				return accessor.name.text;
			}

			return accessor.name.getText(sourceFile);
		}

		function collectAccessorPairs(
			members: ts.NodeArray<ts.Node>,
			sourceFile: AST.SourceFile,
		) {
			const pairs = new Map<string, AccessorPair>();

			members.forEach((member, index) => {
				if (ts.isGetAccessorDeclaration(member)) {
					const getter = member as AST.GetAccessorDeclaration;
					const name = getPropertyName(getter, sourceFile);
					let pair = pairs.get(name);
					if (!pair) {
						pair = {};
						pairs.set(name, pair);
					}
					pair.getter = { index, node: getter };
				} else if (ts.isSetAccessorDeclaration(member)) {
					const setter = member as AST.SetAccessorDeclaration;
					const name = getPropertyName(setter, sourceFile);
					let pair = pairs.get(name);
					if (!pair) {
						pair = {};
						pairs.set(name, pair);
					}
					pair.setter = { index, node: setter };
				}
			});

			return pairs;
		}

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
