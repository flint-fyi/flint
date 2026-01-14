import { describe, expect, it, vi } from "vitest";

import { readGitignore } from "./readGitignore.ts";

const mockReadFileSafe = vi.fn();

vi.mock("./readFileSafe.ts", () => ({
	get readFileSafe() {
		return mockReadFileSafe;
	},
}));

describe(readGitignore, () => {
	it("resolves [] when reading the file gives nothing", async () => {
		mockReadFileSafe.mockResolvedValueOnce(undefined);

		const actual = await readGitignore();

		expect(actual).toEqual([]);
	});

	it("resolves [] when reading the file gives an empty string", async () => {
		mockReadFileSafe.mockResolvedValueOnce("");

		const actual = await readGitignore();

		expect(actual).toEqual([]);
	});

	it("resolves only non-empty lines when the file contains some strings", async () => {
		mockReadFileSafe.mockResolvedValueOnce(["a", "", "b"].join("\n"));

		const actual = await readGitignore();

		expect(actual).toEqual(["a", "b"]);
	});

	it("resolves a non-/ path when a file line starts with /", async () => {
		mockReadFileSafe.mockResolvedValueOnce("/node_modules\n");

		const actual = await readGitignore();

		expect(actual).toEqual(["node_modules"]);
	});
});
