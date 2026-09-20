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
	const artifacts = await getFlintArtifacts(rootPath, packageNames);
	const packageFile = createConsumerPackageFile(artifacts, testCasesPath);

	await fs.mkdir(testCasesPath, { recursive: true });
	await fs.writeFile(
		path.join(testCasesPath, "package.json"),
		`${JSON.stringify(packageFile, undefined, "\t")}\n`,
	);

	// pnpm no longer reads `overrides` from a package.json's `pnpm` field; it only
	// reads them from `pnpm-workspace.yaml`. Redirecting the packed tarballs'
	// transitive `@flint.fyi/*` ranges to the local `.tgz` files therefore has to
	// go here. `packages: []` makes the cases directory a self-contained workspace
	// root so this config is used instead of the repository's (hence no
	// `--ignore-workspace`, which would suppress it).
	const overrides = [...artifacts]
		.map(
			([packageName, artifactPath]) =>
				`  "${packageName}": "file:${path
					.relative(testCasesPath, artifactPath)
					.split(path.sep)
					.join("/")}"`,
		)
		.join("\n");
	await fs.writeFile(
		path.join(testCasesPath, "pnpm-workspace.yaml"),
		`packages: []\noverrides:\n${overrides}\n`,
	);

	await execa("pnpm", ["install", "--dir", testCasesPath]);
}
