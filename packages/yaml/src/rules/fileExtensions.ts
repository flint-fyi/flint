import { yamlLanguage } from "@flint.fyi/yaml-language";
import path from "node:path";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(yamlLanguage, {
	about: {
		description: "Enforces consistent YAML file extensions.",
		id: "fileExtensions",
		presets: ["stylisticStrict"],
	},
	messages: {
		wrongExtension: {
			primary: "Use .yaml extension instead of .yml for YAML files.",
			secondary: [
				"The .yaml extension is the official extension recommended by the YAML specification.",
				"Using .yaml consistently makes file types clearer and avoids confusion with other file types.",
			],
			suggestions: ["Rename the file to use the .yaml extension."],
		},
	},
	setup(context) {
		return {
			visitors: {
				root: (node, { filePath }) => {
					const extension = path.extname(filePath);

					if (extension.toLowerCase() !== ".yml") {
						return;
					}

					context.report({
						message: "wrongExtension",
						range: {
							begin: node.position.start.offset,
							end: node.position.start.offset + 1,
						},
					});
				},
			},
		};
	},
});
