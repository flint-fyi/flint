import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import typescript, {
	SyntaxKind,
} from "@flint.fyi/typescript-language/typescript";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			'Reports unnecessary "use strict" directives in ES modules and classes.',
		id: "unnecessaryUseStricts",
		presets: ["logical"],
	},
	messages: {
		unnecessaryUseStrict: {
			primary:
				'This `"use strict"` directive is redundant and can be safely removed.',
			secondary: [
				"ECMAScript modules and class bodies are automatically in strict mode.",
				'The `"use strict"` directive has no effect and is redundant.',
			],
			suggestions: ['Remove the `"use strict"` directive.'],
		},
	},
	setup(context) {
		return {
			visitors: {
				SourceFile(node, { sourceFile }) {
					if (!typescript.isExternalModule(sourceFile)) {
						return;
					}

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const firstStatement = node.statements[0]!;

					if (
						firstStatement.kind !== SyntaxKind.ExpressionStatement ||
						firstStatement.expression.kind !== SyntaxKind.StringLiteral ||
						firstStatement.expression.text !== "use strict"
					) {
						return;
					}

					const secondStatement = node.statements[1];
					const fixEnd = secondStatement
						? secondStatement.getStart(sourceFile)
						: firstStatement.getEnd();

					context.report({
						fix: {
							range: {
								begin: firstStatement.getStart(sourceFile),
								end: fixEnd,
							},
							text: "",
						},
						message: "unnecessaryUseStrict",
						range: getTSNodeRange(firstStatement, sourceFile),
					});
				},
			},
		};
	},
});
