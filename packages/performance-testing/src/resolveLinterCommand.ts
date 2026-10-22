import fs from "node:fs/promises";
import path from "node:path";

import z from "zod/v4";

import { jsonCodec } from "@flint.fyi/core";

const packageSchema = jsonCodec(
	z.object({
		bin: z.union([z.string(), z.record(z.string(), z.string())]),
	}),
);

export async function resolveLinterCommand(
	linter: string,
	packagePath: string,
): Promise<string> {
	const { bin } = packageSchema.decode(
		(await fs.readFile(packagePath)).toString(),
	);
	const executable = typeof bin === "string" ? bin : bin[linter];
	if (!executable) {
		throw new Error(`Missing ${linter} bin entry in ${packagePath}`);
	}

	return `${JSON.stringify(process.execPath)} ${JSON.stringify(path.resolve(path.dirname(packagePath), executable))}`;
}
