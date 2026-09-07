import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import { writeFile } from "./writeFile.ts";

vi.mock("node:fs/promises", () => ({
	default: { writeFile: vi.fn() },
}));

const mockWriteFile = vi.mocked(fs.writeFile);

describe(writeFile, () => {
	it("formats source as TypeScript when no parser is provided", async () => {
		await writeFile(
			path.normalize("cases/files-2-rules-1"),
			"index.ts",
			"export const x=1",
		);

		expect(mockWriteFile.mock.calls).toEqual([
			[
				path.normalize("cases/files-2-rules-1/index.ts"),
				"export const x = 1;\n",
			],
		]);
	});

	it("stringifies source before formatting when source is not a string", async () => {
		await writeFile(
			path.normalize("cases/files-2-rules-1"),
			"tsconfig.json",
			{ include: ["src"] },
			"json",
		);

		expect(mockWriteFile.mock.calls).toEqual([
			[
				path.normalize("cases/files-2-rules-1/tsconfig.json"),
				'{\n\t"include": ["src"]\n}\n',
			],
		]);
	});
});
