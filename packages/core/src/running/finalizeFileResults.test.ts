import { describe, expect, it } from "vitest";

import type { CommentDirective } from "../types/directives.ts";
import type { LinterHost } from "../types/host.ts";
import { finalizeFileResults } from "./finalizeFileResults.ts";
import type { LanguageAndFile } from "./types.ts";

const noop = () => {
	// Intentional no-op for required test doubles.
};

function createDirective(
	overrides: Partial<CommentDirective> = {},
): CommentDirective {
	return {
		id: "directive-0",
		range: {
			begin: {
				column: 0,
				line: 0,
				raw: 0,
			},
			end: {
				column: 1,
				line: 0,
				raw: 1,
			},
		},
		selections: ["example"],
		type: "disable-file",
		...overrides,
	};
}

describe(finalizeFileResults, () => {
	it("does not create an unused directive report for a redundant matching directive", () => {
		const redundantDirective = createDirective();
		const unusedDirective = createDirective();

		const actual = finalizeFileResults(
			"/test.ts",
			[
				{
					file: {
						about: {
							filePath: "test.ts",
							filePathAbsolute: "/test.ts",
							sourceText: "",
						},
						directives: [unusedDirective],
						redundantDirectives: [redundantDirective],
						services: {},
						[Symbol.dispose]: noop,
					},
					language: {
						about: { name: "test" },
						createFileFactory() {
							throw new Error("Not implemented in test.");
						},
						createRule() {
							throw new Error("Not implemented in test.");
						},
						runFileVisitors: noop,
					},
				} satisfies LanguageAndFile,
			],
			[],
			createHost(),
		);

		expect(actual.reports).toEqual([]);
	});
});

function createHost(): LinterHost {
	return {
		fileTypeSync() {
			throw new Error("Not implemented in test.");
		},
		getCurrentDirectory() {
			return "/";
		},
		getFileTouchTime() {
			return Promise.reject(new Error("Not implemented in test."));
		},
		getFileTouchTimeSync() {
			throw new Error("Not implemented in test.");
		},
		isCaseSensitiveFS() {
			return true;
		},
		readDirectory() {
			return Promise.reject(new Error("Not implemented in test."));
		},
		readDirectorySync() {
			throw new Error("Not implemented in test.");
		},
		readFile() {
			return Promise.reject(new Error("Not implemented in test."));
		},
		readFileSync() {
			throw new Error("Not implemented in test.");
		},
		watchDirectorySync() {
			throw new Error("Not implemented in test.");
		},
		watchFileSync() {
			throw new Error("Not implemented in test.");
		},
		writeFile() {
			return Promise.reject(new Error("Not implemented in test."));
		},
		writeFileSync() {
			throw new Error("Not implemented in test.");
		},
	};
}
