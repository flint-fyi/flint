import { getNodeRange, jsonLanguage } from "@flint.fyi/json-language";
import { normalizeDirname } from "@flint.fyi/utils";

import { getPackagePropertyOfName } from "../getPackagePropertyOfName.ts";
import { ruleCreator } from "../ruleCreator.ts";

export default ruleCreator.createRule(jsonLanguage, {
	about: {
		description:
			"Enforce that repository.directory matches the package.json file directory.",
		id: "repositoryDirectoryValidity",
		presets: ["logical"],
	},
	messages: {
		mismatchedDirectory: {
			primary:
				"The repository directory should match this package.json file's directory.",
			secondary: [
				"The repository.directory field points to the package's root, relative to the repository root.",
			],
			suggestions: ["Replace with the relative path for this package's root."],
		},
	},
	setup(context) {
		return {
			visitors: {
				Document(node, { filePathAbsolute }) {
					const repository = getPackagePropertyOfName(node, "repository");
					if (repository?.value.type !== "Object") {
						return;
					}

					const directory = repository.value.members.find(
						(property) =>
							property.name.type === "String" &&
							property.name.value === "directory",
					);

					if (directory?.value.type !== "String") {
						return;
					}

					const repositoryRoot = context.host.getRepositoryRoot();
					const repositoryDirectory = directory.value.value;

					if (!repositoryRoot) {
						const fileDirectory = normalizeDirname(filePathAbsolute);
						if (
							repositoryDirectory === fileDirectory ||
							fileDirectory.endsWith(`/${repositoryDirectory}`)
						) {
							return;
						}

						context.report({
							message: "mismatchedDirectory",
							range: getNodeRange(directory.value),
						});
						return;
					}

					const fileDirectory = normalizeDirname(filePathAbsolute);
					const expectedDirectory = fileDirectory.slice(
						repositoryRoot.length + 1,
					);

					if (repositoryDirectory === expectedDirectory) {
						return;
					}

					const range = getNodeRange(directory.value);

					context.report({
						message: "mismatchedDirectory",
						range,
						suggestions: [
							{
								id: "replaceRepositoryDirectory",
								range,
								text: JSON.stringify(expectedDirectory),
							},
						],
					});
				},
			},
		};
	},
});
