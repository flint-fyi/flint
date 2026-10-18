import fs from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

export async function resolveLinterCommand(
	linter: string,
	directory: string,
): Promise<string> {
	const packagePath = createRequire(
		path.resolve(directory, "package.json"),
	).resolve(`${linter}/package.json`);
	const { bin } = JSON.parse(await fs.readFile(packagePath, "utf8")) as {
		bin: Record<string, string>;
	};
	const executable = bin[linter];
	if (!executable) {
		throw new Error(`Missing ${linter} bin entry in ${packagePath}`);
	}

	return `${JSON.stringify(process.execPath)} ${JSON.stringify(path.resolve(path.dirname(packagePath), executable))}`;
}
