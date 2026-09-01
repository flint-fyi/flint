import fs from "node:fs/promises";
import path from "node:path";

import { execa } from "execa";

import { createConsumerPackageFile } from "./creators/createConsumerPackageFile.ts";
import { getFlintArtifacts } from "./getFlintArtifacts.ts";

export async function prepareConsumer(
	rootPath: string,
	testCasesPath: string,
	packageNames: readonly string[] = ["flint"],
): Promise<void> {
	const packageFile = createConsumerPackageFile(
		await getFlintArtifacts(rootPath, packageNames),
		testCasesPath,
	);

	await fs.mkdir(testCasesPath, { recursive: true });
	await fs.writeFile(
		path.join(testCasesPath, "package.json"),
		`${JSON.stringify(packageFile, undefined, "\t")}\n`,
	);
	await execa("pnpm", [
		"install",
		"--dir",
		testCasesPath,
		"--ignore-workspace",
	]);
}
