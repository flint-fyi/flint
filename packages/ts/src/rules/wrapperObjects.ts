import {
	getTSNodeRange,
	isGlobalDeclarationOfName,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

const wrapperConstructors = new Set(["Boolean", "Number", "String"]);

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Flags using `new` with `Boolean`, `Number`, or `String`, which creates wrapper objects instead of primitives.",
		id: "wrapperObjects",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		wrapperObject: {
			primary:
				"{{ name }} wrapper objects are rarely intended and can cause unexpected behavior.",
			secondary: [
				"Using `new {{ name }}()` creates an object wrapper around a primitive value, not the primitive itself.",
				"Object wrappers behave differently from primitives in comparisons: `new String('a') !== 'a'`.",
			],
			suggestions: [
				"Use `{{ name }}()` without `new` to coerce values to primitives.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				NewExpression: (node, { sourceFile, typeChecker }) => {
					if (
						node.expression.kind !== ts.SyntaxKind.Identifier ||
						!wrapperConstructors.has(node.expression.text) ||
						!isGlobalDeclarationOfName(
							node.expression,
							node.expression.text,
							typeChecker,
						)
					) {
						return;
					}

					const range = getTSNodeRange(node, sourceFile);

					context.report({
						data: { name: node.expression.text },
						message: "wrapperObject",
						range,
					});
				},
			},
		};
	},
});
