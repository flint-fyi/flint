import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { resolveLinterCommand } from "./resolveLinterCommand.ts";

describe(resolveLinterCommand, () => {
	it("uses the consumer's declared bin and quotes paths containing spaces", async () => {
		const directory = await fs.realpath(
			await fs.mkdtemp(path.join(os.tmpdir(), "flint consumer ")),
		);
		try {
			const packageDirectory = path.join(directory, "node_modules/flint");
			await fs.mkdir(packageDirectory, { recursive: true });
			await fs.writeFile(
				path.join(packageDirectory, "package.json"),
				JSON.stringify({
					bin: { flint: "./custom output/cli.mjs" },
					exports: { "./package.json": "./package.json" },
					name: "flint",
				}),
			);

			expect(await resolveLinterCommand("flint", directory)).toBe(
				`${JSON.stringify(process.execPath)} ${JSON.stringify(path.join(packageDirectory, "custom output/cli.mjs"))}`,
			);
		} finally {
			await fs.rm(directory, { force: true, recursive: true });
		}
	});
});
