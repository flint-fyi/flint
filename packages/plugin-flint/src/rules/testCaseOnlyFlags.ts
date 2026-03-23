import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import { SyntaxKind } from "typescript";

import { findProperty } from "../utils/findProperty.ts";
import { getRuleTesterCaseArrays } from "../utils/getRuleTesterCaseArrays.ts";
import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports test cases that are marked `only: true`.",
		id: "testCaseOnlyFlags",
		presets: ["logical"],
	},
	messages: {
		testCaseOnly: {
			primary: "Do not commit test cases with `only: true`.",
			secondary: [
				"The `only` flag is useful for local debugging, but it prevents the rest of the test suite from running.",
				"Leaving it in committed rule tests can hide failures in other test cases.",
			],
			suggestions: ["Remove the `only: true` property before committing."],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression(node, { sourceFile }) {
					const testArrays = getRuleTesterCaseArrays(node);
					if (!testArrays) {
						return;
					}

					for (const testCase of [
						...testArrays.valid.elements,
						...testArrays.invalid.elements,
					]) {
						if (testCase.kind !== SyntaxKind.ObjectLiteralExpression) {
							continue;
						}

						const onlyInitializer = findProperty(
							testCase.properties,
							"only",
							(node): node is AST.TrueLiteral =>
								node.kind === SyntaxKind.TrueKeyword,
						);
						if (!onlyInitializer) {
							continue;
						}

						context.report({
							message: "testCaseOnly",
							range: getTSNodeRange(onlyInitializer.parent, sourceFile),
						});
					}
				},
			},
		};
	},
});
