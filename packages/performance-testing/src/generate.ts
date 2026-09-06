import fs from "node:fs/promises";
import path from "node:path";

import { debugForFile } from "debug-for-file";

import { createTestCaseSlug } from "./createTestCaseSlug.ts";
import { createPackageFile } from "./creators/files/createPackageFile.ts";
import { writeCaseFiles } from "./creators/writeCaseFiles.ts";
import { prepareConsumer } from "./prepareConsumer.ts";
import { testCaseEntries, testCasesPath, type TestCase } from "./testCases.ts";
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

	const createdFiles = await writeCaseFiles(testCase, directory);

	log("Created", createdFiles, "files");
}

await fs.rm(testCasesPath, { force: true, recursive: true });
await prepareConsumer(
	path.resolve(import.meta.dirname, "../../.."),
	path.resolve(testCasesPath),
);

for (const files of testCaseEntries[0].values) {
	for (const rules of testCaseEntries[1].values) {
		// flint-disable-next-line performance/loopAwaits
		await createCase({ files, rules });
	}
}

log("Seeded cases.");
