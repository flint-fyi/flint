import { inflateRawSync } from "node:zlib";

import { describe, expect, it } from "vitest";

import {
	decodePlaygroundHash,
	encodePlaygroundHash,
	type PlaygroundState,
} from "./playgroundHash.ts";

const state: PlaygroundState = {
	activeFileName: "data.json",
	files: [
		{ code: "export const café = '☕';\n", name: "index.ts" },
		{ code: '{ "a": 1 }', name: "data.json" },
	],
};

const stateHash =
	"#files=q1ZKTC7JLEt1y8xJ9UvMTVWyUkpJLEnUyyrOz1PSUUrLzEktVrKKrlZKzk8BSaZWFOQXlSgk5-cVlygkJ6YdXqlgq6D-aMZUdesYkIY8iBmZeSmpFXolxUq1OnCt1QoxSokxSlYKhgq1CJUI22pjawE";

async function encodeValue(value: unknown): Promise<string> {
	return await encodePlaygroundHash(value as PlaygroundState);
}

describe(encodePlaygroundHash, () => {
	it("encodes files and the active file as compressed base64url JSON", async () => {
		const hash = await encodePlaygroundHash(state);

		expect(hash).toBe(stateHash);
		expect(
			JSON.parse(
				inflateRawSync(
					Buffer.from(hash.slice("#files=".length), "base64url"),
				).toString(),
			),
		).toEqual(state);
	});
});

describe(decodePlaygroundHash, () => {
	it("decodes files and the active file from a known hash", async () => {
		expect(await decodePlaygroundHash(stateHash)).toEqual(state);
	});

	it("round trips files and the active file", async () => {
		const hash = await encodePlaygroundHash(state);

		expect(hash).toMatch(/^#files=[\w-]+$/);
		expect(await decodePlaygroundHash(hash)).toEqual(state);
	});

	it("returns undefined for a hash without files", async () => {
		expect(await decodePlaygroundHash("")).toBeUndefined();
		expect(await decodePlaygroundHash("#overview")).toBeUndefined();
	});

	it("returns false for a corrupted hash", async () => {
		expect(await decodePlaygroundHash("#files=not-valid")).toBe(false);
	});

	it.each([
		["no files", { activeFileName: "index.ts", files: [] }],
		[
			"an unsupported file",
			{ activeFileName: "a.css", files: [{ code: "", name: "a.css" }] },
		],
		[
			"duplicate files",
			{
				activeFileName: "a.ts",
				files: [
					{ code: "", name: "a.ts" },
					{ code: "", name: "a.ts" },
				],
			},
		],
		[
			"a reserved file",
			{
				activeFileName: "tsconfig.json",
				files: [{ code: "{}", name: "tsconfig.json" }],
			},
		],
	])("returns false for %s", async (_, value) => {
		expect(await decodePlaygroundHash(await encodeValue(value))).toBe(false);
	});

	it("falls back to the first file when the active file is missing", async () => {
		const hash = await encodeValue({ ...state, activeFileName: "missing.ts" });

		expect(await decodePlaygroundHash(hash)).toEqual({
			...state,
			activeFileName: "index.ts",
		});
	});
});
