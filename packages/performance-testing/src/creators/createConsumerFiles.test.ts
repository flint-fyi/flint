import path from "node:path";

import { describe, expect, it } from "vitest";

import { createConsumerFiles } from "./createConsumerFiles.ts";

describe(createConsumerFiles, () => {
	it("installs Flint and overrides its workspace dependencies with artifacts", () => {
		const casesPath = path.join("workspace", "performance-testing", "cases");
		const artifacts = new Map([
			["@flint.fyi/cli", path.join("workspace", "flint.fyi-cli-2.3.4.tgz")],
			["flint", path.join("workspace", "flint-1.2.3.tgz")],
		]);

		const actual = createConsumerFiles(artifacts, casesPath);

		expect(actual).toEqual({
			packageFile: {
				dependencies: {
					flint: "file:../../flint-1.2.3.tgz",
				},
				name: "@flint.fyi/performance-testing-cases",
				private: true,
				type: "module",
			},
			workspaceFile: {
				overrides: {
					"@flint.fyi/cli": "file:../../flint.fyi-cli-2.3.4.tgz",
					flint: "file:../../flint-1.2.3.tgz",
				},
			},
		});
	});
});
