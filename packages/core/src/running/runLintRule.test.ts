import { describe, expect, it } from "vitest";

import { createLanguage } from "../languages/createLanguage.ts";
import { runLintRule } from "./runLintRule.ts";

describe(runLintRule, () => {
	it("de-duplicates identical reports from multiple source traversals", async () => {
		const language = createLanguage<{ Source: object }>({
			about: { name: "Test" },
			createFileFactory: () => ({ createFile: () => ({}) as never }),
			runFileVisitors(_file, _options, runtime) {
				runtime.visitors?.Source?.({}, { options: undefined });
				runtime.visitors?.Source?.({}, { options: undefined });
			},
		});
		const rule = language.createRule({
			about: { description: "Description", id: "rule" },
			messages: {
				message: { primary: "Message", secondary: [], suggestions: [] },
			},
			setup(context) {
				return {
					visitors: {
						Source: () => {
							context.report({
								message: "message",
								range: { begin: 0, end: 1 },
							});
						},
					},
				};
			},
		});
		const file = {
			about: {
				filePath: "file.ts",
				filePathAbsolute: "/project/file.ts",
				sourceText: "x",
			},
			services: {},
			[Symbol.dispose]: () => undefined,
		};

		const reports = await runLintRule(
			rule,
			[{ languageFiles: [{ file, language }], options: undefined }],
			{} as never,
		);

		expect(reports.get("file.ts")).toHaveLength(1);
	});
});
