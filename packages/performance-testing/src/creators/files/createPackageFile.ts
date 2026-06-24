import type { TestCase } from "../../testCases.ts";
import { createTestCaseSlug } from "../../utils.ts";

export function createPackageFile(data: TestCase) {
	return {
		devDependencies: {
			"@eslint/js": "*",
			eslint: "*",
			typescript: "*",
			"typescript-eslint": "rc-v8",
		},
		name: createTestCaseSlug(data),
		private: true,
		scripts: {
			lint: "eslint src",
		},
		type: "module",
	};
}
