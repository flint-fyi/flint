import "./index.ts";

import { createVFSLinterHost } from "@flint.fyi/core";
import {
	createRuleTesterTSConfig,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import { describe, expect, it } from "vitest";

describe("vueLanguage", () => {
	it("preserves redundant directives collected from template directives", () => {
		const host = createVFSLinterHost({
			caseSensitive: true,
			cwd: "/root",
		});

		for (const [name, content] of Object.entries(createRuleTesterTSConfig())) {
			host.vfsUpsertFile(`/root/${name}`, content);
		}

		const sourceText = `
<template>
	<!-- flint-disable-lines-begin ts/debugger* -->
	<!-- flint-disable-lines-begin ts/debuggerStatements -->
	<div />
</template>
`;

		host.vfsUpsertFile("/root/file.vue", sourceText);

		const factory = typescriptLanguage.createFileFactory(host);
		using file = factory.createFile({
			filePath: "file.vue",
			filePathAbsolute: "/root/file.vue",
			sourceText,
		});

		expect(file.redundantDirectives).toMatchObject([
			{
				selections: ["ts/debuggerStatements"],
				type: "disable-lines-begin",
			},
		]);
		expect(file.reports).toHaveLength(1);
		expect(file.reports?.[0]).toMatchObject({
			about: {
				id: "commentDirectiveAlreadyDisabled",
			},
		});
	});
});
