import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import { SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports empty object type literals and empty interfaces that are often used incorrectly.",
		id: "emptyObjectTypes",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		emptyInterface: {
			primary:
				"Empty interfaces are often used incorrectly and should be avoided.",
			secondary: [
				"An empty interface `interface Foo {}` is equivalent to the `{}` type, which matches any non-nullish value.",
				"Consider using `object` for any object, `unknown` for any value, or adding members to the interface.",
			],
			suggestions: [
				"Add members to the interface, or use `object` or `unknown` instead.",
			],
		},
		emptyObjectType: {
			primary:
				"The `{}` type means 'any non-nullish value' and is often used incorrectly.",
			secondary: [
				"The `{}` type allows any value except `null` and `undefined`, including primitives like strings and numbers.",
				"If you want to represent any object, use `object`. If you want any value, use `unknown`.",
			],
			suggestions: [
				"Use `object` for any object value, or `unknown` for any value including `null` and `undefined`.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				InterfaceDeclaration: (node, { sourceFile }) => {
					if (node.members.length) {
						return false;
					}

					const extendsClause = node.heritageClauses?.find(
						(clause) => clause.token === SyntaxKind.ExtendsKeyword,
					);

					if (extendsClause && extendsClause.types.length > 1) {
						return;
					}

					context.report({
						message: "emptyInterface",
						range: getTSNodeRange(node, sourceFile),
					});
				},
				TypeLiteral: (node, { sourceFile }) => {
					if (
						node.members.length ||
						node.parent.kind === SyntaxKind.IntersectionType ||
						node.parent.kind === SyntaxKind.MappedType
					) {
						return;
					}

					context.report({
						message: "emptyObjectType",
						range: getTSNodeRange(node, sourceFile),
					});
				},
			},
		};
	},
});
