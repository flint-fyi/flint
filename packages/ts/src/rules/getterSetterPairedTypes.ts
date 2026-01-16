import {
	type AST,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

interface AccessorPair {
	getter?: AST.GetAccessorDeclaration;
	setter?: AST.SetAccessorDeclaration;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports mismatched types between getter and setter accessor pairs.",
		id: "getterSetterPairedTypes",
		presets: ["logical"],
	},
	messages: {
		mismatchedTypes: {
			primary:
				"The getter return type must be assignable to the setter parameter type.",
			secondary: [
				"Getter and setter accessor pairs should have compatible types.",
				"Having mismatched types means assigning a property to itself would not work.",
			],
			suggestions: [
				"Ensure the getter return type is assignable to the setter parameter type.",
			],
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

			for (const member of members) {
				if (ts.isGetAccessorDeclaration(member)) {
					const getter = member as AST.GetAccessorDeclaration;
					const name = getPropertyName(getter, sourceFile);
					let pair = pairs.get(name);
					if (!pair) {
						pair = {};
						pairs.set(name, pair);
					}
					pair.getter = getter;
				} else if (ts.isSetAccessorDeclaration(member)) {
					const setter = member as AST.SetAccessorDeclaration;
					const name = getPropertyName(setter, sourceFile);
					let pair = pairs.get(name);
					if (!pair) {
						pair = {};
						pairs.set(name, pair);
					}
					pair.setter = setter;
				}
			}

			return pairs;
		}

		function checkPairs(
			pairs: Map<string, AccessorPair>,
			{ sourceFile, typeChecker }: TypeScriptFileServices,
		) {
			for (const [, pair] of pairs) {
				if (!pair.getter || !pair.setter) {
					continue;
				}

				const getterReturnType = typeChecker.getTypeAtLocation(pair.getter);

				const setterParameter = pair.setter.parameters[0];
				if (!setterParameter) {
					continue;
				}

				const setterParameterType =
					typeChecker.getTypeAtLocation(setterParameter);

				if (
					!typeChecker.isTypeAssignableTo(getterReturnType, setterParameterType)
				) {
					context.report({
						message: "mismatchedTypes",
						range: {
							begin: pair.getter.name.getStart(sourceFile),
							end: pair.getter.name.getEnd(),
						},
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

		function checkInterfaceOrTypeLiteral(
			node: AST.InterfaceDeclaration | AST.TypeLiteralNode,
			services: TypeScriptFileServices,
		) {
			const pairs = collectAccessorPairs(node.members, services.sourceFile);
			checkPairs(pairs, services);
		}

		return {
			visitors: {
				ClassDeclaration: checkClassLike,
				ClassExpression: checkClassLike,
				InterfaceDeclaration: checkInterfaceOrTypeLiteral,
				ObjectLiteralExpression: checkObjectLiteral,
				TypeLiteral: checkInterfaceOrTypeLiteral,
			},
		};
	},
});
