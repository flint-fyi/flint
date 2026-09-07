import type { TestCase } from "../testCases.ts";
import { writeStructure } from "../writing/writeStructure.ts";
import { createCaseFiles } from "./createCaseFiles.ts";

export async function writeCaseFiles(
	data: TestCase,
	directory: string,
): Promise<number> {
	return await writeStructure(directory, createCaseFiles(data));
}
