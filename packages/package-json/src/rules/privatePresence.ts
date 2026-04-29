import { jsonLanguage } from "@flint.fyi/json-language";

import { getPackagePropertyOfName } from "../getPackagePropertyOfName.ts";
import { ruleCreator } from "../ruleCreator.ts";

export default ruleCreator.createRule(jsonLanguage, {
	about: {
		description: `Enforces that the \`private\` property is present.`,
		id: "privatePresence",
	},
	messages: {
		missing: {
			primary: `Property \`private\` is expected to be present.`,
			secondary: [
				`This repository expects a \`private\` property in this package.json file.`,
				`Keeping expected package metadata available helps tooling reason about the package.`,
			],
			suggestions: [`Add the missing \`private\`.`],
		},
	},
	setup(context) {
		return {
			visitors: {
				JsonSourceFile: (node) => {
					if (!getPackagePropertyOfName(node, "private")) {
						context.report({
							message: "missing",
							range: { begin: 0, end: 1 },
						});
					}
				},
			},
		};
	},
});
