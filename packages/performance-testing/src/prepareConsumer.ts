import fs from "node:fs/promises";
import path from "node:path";

import { execa } from "execa";

import { createConsumerFiles } from "./creators/createConsumerFiles.ts";
import { getFlintArtifacts } from "./getFlintArtifacts.ts";

export async function prepareConsumer(
	rootPath: string,
	testCasesPath: string,
): Promise<void> {
	const { packageFile, workspaceFile } = createConsumerFiles(
		await getFlintArtifacts(rootPath),
		testCasesPath,
	);

	await fs.mkdir(testCasesPath, { recursive: true });
	await fs.writeFile(
		path.join(testCasesPath, "package.json"),
		`${JSON.stringify(packageFile, undefined, "\t")}\n`,
	);
	await fs.writeFile(
		path.join(testCasesPath, "pnpm-workspace.yaml"),
		`${JSON.stringify(workspaceFile, undefined, "\t")}\n`,
	);
	await execa("pnpm", ["install", "--dir", testCasesPath]);
}
