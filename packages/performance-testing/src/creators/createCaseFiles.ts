import type { TestCase } from "../testCases.ts";
import type { Structure } from "../writing/writeStructure.ts";
import { createESLintConfigFile } from "./files/createESLintConfigFile.ts";
import { createFlintConfigFile } from "./files/createFlintConfigFile.ts";
import {
	createModuleCycle,
	type ModuleCreator,
	type ModuleDependency,
} from "./files/createModuleFile.ts";
import { createStandardTSConfigFile } from "./files/createStandardTSConfigFile.ts";
import { range } from "./range.ts";

// Example directories with nested directories hold modules 0 and 1 in nested1 and nested2.
const nestedDependencies: readonly ModuleDependency[] = [
	{ index: 0, path: "./nested1/index.ts" },
	{ index: 1, path: "./nested2/index.ts" },
];

export function countCaseFiles(testCase: TestCase): number {
	return countStructureFiles(createSourceFiles(testCase));
}

export function createCaseFiles(testCase: TestCase): Structure {
	return {
		"eslint.config.js": [createESLintConfigFile(testCase.rules), "typescript"],
		"flint.config.ts": [createFlintConfigFile(testCase.rules), "typescript"],
		src: createSourceFiles(testCase),
		"tsconfig.json": [createStandardTSConfigFile(), "json"],
	};
}

function countStructureFiles(structure: Structure): number {
	return Object.values(structure).reduce(
		(total, value) =>
			total + (Array.isArray(value) ? 1 : countStructureFiles(value)),
		0,
	);
}

function createExampleDirectory(
	index: number,
	createModule: ModuleCreator,
): Structure {
	return {
		"index.ts": [createExampleFile(index, createModule), "typescript"],
		...(index > 2 &&
			Object.fromEntries(
				range(1, index).map((i) => [
					`nested${i}`,
					createExampleDirectory(i - 1, createModule),
				]),
			)),
	};
}

function createExampleFile(index: number, createModule: ModuleCreator): string {
	return [
		index > 2 &&
			range(1, index)
				.map((i) => `export * as nested${i} from "./nested${i}/index.ts";`)
				.join("\n\t\t"),
		createModule(index, index > 2 ? nestedDependencies : []),
	]
		.filter(Boolean)
		.join("\n\n");
}

function createIndexFile(topLevelWidth: number): string {
	const indices = range(0, topLevelWidth);

	return `
		import { example0 } from "./example0/index.ts";
		
		export async function root(): Promise<void> {
			const summaries = [await example0("")];

			// Lint report: ts/forInArrays
			for (const i in summaries) {}
			
			// No lint report
			for (const i of summaries) {}
		}

		${indices.map((index) => `export { example${index} } from "./example${index}/index.ts";`).join("\n\t\t")}
	`;
}

function createSourceFiles(testCase: TestCase): Structure {
	// Each example directory holds as many files as every directory before it
	// combined, so the file count doubles with each one.
	const topLevelWidth =
		testCase.files <= 2 ? 1 : Math.round(Math.log2(testCase.files)) + 1;
	const createModule = createModuleCycle();

	return {
		"index.ts": [createIndexFile(topLevelWidth), "typescript"],
		...Object.fromEntries(
			Array.from({ length: topLevelWidth }, (_, index) => [
				`example${index}`,
				createExampleDirectory(index, createModule),
			]),
		),
	};
}
