import path from "node:path";

import { describe, expect, it } from "vitest";

import { createConsumerPackageFile } from "./createConsumerPackageFile.ts";

describe(createConsumerPackageFile, () => {
	it("installs Flint and overrides its workspace dependencies with artifacts", () => {
		const casesPath = path.join("workspace", "performance-testing", "cases");
		const artifacts = new Map([
			["@flint.fyi/astro", path.join("workspace", "flint.fyi-astro-1.0.0.tgz")],
			["@flint.fyi/cli", path.join("workspace", "flint.fyi-cli-2.3.4.tgz")],
			["flint", path.join("workspace", "flint-1.2.3.tgz")],
		]);

		const actual = createConsumerPackageFile(artifacts, casesPath);

		expect(actual).toEqual({
			dependencies: {
				"@flint.fyi/astro": "file:../../flint.fyi-astro-1.0.0.tgz",
				flint: "file:../../flint-1.2.3.tgz",
			},
			name: "@flint.fyi/performance-testing-cases",
			pnpm: {
				overrides: {
					"@flint.fyi/astro": "file:../../flint.fyi-astro-1.0.0.tgz",
					"@flint.fyi/cli": "file:../../flint.fyi-cli-2.3.4.tgz",
					flint: "file:../../flint-1.2.3.tgz",
				},
			},
			private: true,
			type: "module",
		});
	});
});
