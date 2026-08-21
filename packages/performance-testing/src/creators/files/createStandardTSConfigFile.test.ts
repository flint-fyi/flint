import { describe, expect, it } from "vitest";

import { createStandardTSConfigFile } from "./createStandardTSConfigFile.ts";

describe("createStandardTSConfigFile", () => {
	it("includes only src and type checks without emitting", () => {
		const actual = createStandardTSConfigFile();

		expect(actual).toEqual({
			compilerOptions: {
				allowImportingTsExtensions: true,
				module: "NodeNext",
				noEmit: true,
				skipLibCheck: true,
				strict: true,
				target: "ESNext",
			},
			include: ["src"],
		});
	});
});
