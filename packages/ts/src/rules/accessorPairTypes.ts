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
		id: "accessorPairTypes",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		mismatchedTypes: {
			primary:
				"A getter's return type should be assignable to its corresponding setter's parameter type.",
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
		// TODO: Use a util like getStaticValue
		// https://github.com/flint-fyi/flint/issues/1298
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
			members: ts.NodeArray<AST.AnyNode>,
			sourceFile: AST.SourceFile,
		) {
			const pairs = new Map<string, AccessorPair>();

			for (const member of members) {
				if (
					member.kind !== ts.SyntaxKind.GetAccessor &&
					member.kind !== ts.SyntaxKind.SetAccessor
				) {
					continue;
				}

				const name = getPropertyName(member, sourceFile);
				let pair = pairs.get(name);
				if (!pair) {
					pair = {};
					pairs.set(name, pair);
				}

				if (member.kind === ts.SyntaxKind.GetAccessor) {
					pair.getter = member;
				} else {
					pair.setter = member;
				}
			}

			return pairs;
		}

		function checkPairs(
			pairs: Map<string, AccessorPair>,
			{ sourceFile, typeChecker }: TypeScriptFileServices,
		) {
			for (const [, pair] of pairs) {
				if (!pair.getter || pair.setter?.parameters.length !== 1) {
					continue;
				}

				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const setterParameter = pair.setter.parameters[0]!;

				const getterReturnType = typeChecker.getTypeAtLocation(pair.getter);

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
