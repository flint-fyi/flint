import { describe, expect, it } from "vitest";

import { createPackageFile } from "./createPackageFile.ts";

describe("createPackageFile", () => {
	it("names the package after the test case slug", () => {
		const actual = createPackageFile({ files: 2, rules: "many" });

		expect(actual).toEqual({
			name: "files-2-rules-many",
			private: true,
			type: "module",
		});
	});
});
