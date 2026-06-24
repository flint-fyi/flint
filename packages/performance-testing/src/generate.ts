import fs from "node:fs/promises";
import path from "node:path";

import { debugForFile } from "debug-for-file";
import { execa } from "execa";

import { createPackageFile } from "./creators/files/createPackageFile.ts";
import { writeCaseFiles } from "./creators/writeCaseFiles.ts";
import { testCaseEntries, testCasesPath, type TestCase } from "./testCases.ts";
import { createTestCaseSlug } from "./utils.ts";
import { writeFile } from "./writing/writeFile.ts";

const log = debugForFile(import.meta.filename);

async function createCase(testCase: TestCase) {
	const testCaseSlug = createTestCaseSlug({
		files: testCase.files,
		rules: testCase.rules,
	});
	const directory = path.join(testCasesPath, testCaseSlug);

	log(`Populating ${testCaseSlug}...`);

	await fs.mkdir(path.join(directory, "src"), { recursive: true });
	await writeFile(
		directory,
		"package.json",
		createPackageFile(testCase),
		"json",
	);

	log("Created", await writeCaseFiles(testCase, directory), "files");
}

await fs.mkdir(testCasesPath, { recursive: true });

for (const nested of await fs.readdir(testCasesPath)) {
	await fs.rm(path.join(testCasesPath, nested), {
		force: true,
		recursive: true,
	});
}

for (const files of testCaseEntries[0].values) {
	for (const rules of testCaseEntries[1].values) {
		await createCase({ files, rules });
	}
}

await execa({ stdio: "inherit" })`pnpm install`;

log("Seeded cases.");
