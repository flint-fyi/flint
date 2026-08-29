import fs from "node:fs/promises";
import path from "node:path";

import { execa } from "execa";

interface PackageData {
	dependencies?: Record<string, string>;
	name: string;
	version: string;
}

const packCommand = "pnpm build && pnpm --filter-prod flint... pack";

export function createConsumerPackageFile(
	artifacts: Map<string, string>,
	testCasesPath: string,
): object {
	const overrides = Object.fromEntries(
		[...artifacts].map(([packageName, artifactPath]) => [
			packageName,
			`file:${path.relative(testCasesPath, artifactPath).split(path.sep).join("/")}`,
		]),
	);

	return {
		dependencies: { flint: overrides.flint },
		name: "@flint.fyi/performance-testing-cases",
		pnpm: { overrides },
		private: true,
		type: "module",
	};
}

export async function getFlintArtifacts(
	rootPath: string,
): Promise<Map<string, string>> {
	const packagesPath = path.join(rootPath, "packages");
	const packageData = await Promise.all(
		(await fs.readdir(packagesPath, { withFileTypes: true }))
			.filter((entry) => entry.isDirectory())
			.map(async (entry) => {
				try {
					return JSON.parse(
						(
							await fs.readFile(
								path.join(packagesPath, entry.name, "package.json"),
							)
						).toString(),
					) as PackageData;
				} catch (error) {
					if ((error as NodeJS.ErrnoException).code === "ENOENT") {
						return undefined;
					}

					throw error;
				}
			}),
	);
	const packages = new Map(
		packageData
			.filter((data) => data !== undefined)
			.map((data) => [data.name, data]),
	);

	const artifacts = new Map<string, string>();

	async function addArtifact(packageName: string): Promise<void> {
		const packageData = packages.get(packageName);
		if (!packageData) {
			throw new Error(`Workspace package not found: ${packageName}`);
		}

		await Promise.all(
			Object.entries(packageData.dependencies ?? {})
				.filter(([, version]) => version.startsWith("workspace:"))
				.map(async ([dependencyName]) => {
					await addArtifact(dependencyName);
				}),
		);

		const artifactPath = path.join(
			rootPath,
			`${packageData.name.replace("@", "").replace("/", "-")}-${packageData.version}.tgz`,
		);

		try {
			await fs.access(artifactPath);
		} catch {
			throw new Error(
				`Missing packed Flint artifact: ${artifactPath}\nRun: ${packCommand}`,
			);
		}

		artifacts.set(packageName, artifactPath);
	}

	await addArtifact("flint");

	return new Map(
		[...artifacts].sort(([left], [right]) => left.localeCompare(right)),
	);
}

export async function prepareConsumer(
	rootPath: string,
	testCasesPath: string,
): Promise<void> {
	const packageFile = createConsumerPackageFile(
		await getFlintArtifacts(rootPath),
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
