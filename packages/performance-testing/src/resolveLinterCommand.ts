import fs from "node:fs/promises";
import path from "node:path";

export async function resolveLinterCommand(
	linter: string,
	packagePath: string,
): Promise<string> {
	const { bin } = JSON.parse((await fs.readFile(packagePath)).toString()) as {
		bin: Record<string, string>;
	};
	const executable = bin[linter];
	if (!executable) {
		throw new Error(`Missing ${linter} bin entry in ${packagePath}`);
	}

	return `${JSON.stringify(process.execPath)} ${JSON.stringify(path.resolve(path.dirname(packagePath), executable))}`;
}
