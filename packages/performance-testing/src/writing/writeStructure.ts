import fs from "node:fs/promises";
import path from "node:path";

import type * as prettier from "prettier";

import { writeFile } from "./writeFile.ts";

export type FileToWrite = [unknown, prettier.BuiltInParserName];

export interface Structure {
	[i: string]: FileToWrite | Structure;
}

export async function writeStructure(
	directory: string,
	structure: Structure,
): Promise<number> {
	let created = 0;
	await fs.mkdir(directory, { recursive: true });

	for (const [filePath, value] of Object.entries(structure)) {
		if (Array.isArray(value)) {
			// flint-disable-next-line performance/loopAwaits
			await writeFile(directory, filePath, ...value);
			created += 1;
		} else {
			// flint-disable-next-line performance/loopAwaits
			created += await writeStructure(path.join(directory, filePath), value);
		}
	}

	return created;
}
