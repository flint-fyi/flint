import fs from "node:fs/promises";
import path from "node:path";

import { execa } from "execa";

import {
	createArtifactSpecifiers,
	createConsumerPackageFile,
} from "./creators/createConsumerPackageFile.ts";
import { getFlintArtifacts } from "./getFlintArtifacts.ts";

export async function prepareConsumer(
	rootPath: string,
	testCasesPath: string,
	packageNames: readonly string[] = ["flint"],
): Promise<void> {
	const artifactSpecifiers = createArtifactSpecifiers(
		await getFlintArtifacts(rootPath, packageNames),
		testCasesPath,
	);

	await fs.mkdir(testCasesPath, { recursive: true });
	await fs.writeFile(
		path.join(testCasesPath, "package.json"),
		`${JSON.stringify(createConsumerPackageFile(artifactSpecifiers), undefined, "\t")}\n`,
	);

	// The tarballs depend on each other through registry ranges, which these
	// overrides redirect to the local tarballs. pnpm only reads `overrides` from
	// pnpm-workspace.yaml, and `packages: []` makes the cases directory its own
	// workspace root so pnpm reads this file instead of the repository's.
	const overrides = Object.entries(artifactSpecifiers)
		.map(
			([packageName, specifier]) =>
				`  ${JSON.stringify(packageName)}: ${JSON.stringify(specifier)}`,
		)
		.join("\n");
	await fs.writeFile(
		path.join(testCasesPath, "pnpm-workspace.yaml"),
		`packages: []\noverrides:\n${overrides}\n`,
	);

	await execa("pnpm", ["install", "--dir", testCasesPath]);
}
