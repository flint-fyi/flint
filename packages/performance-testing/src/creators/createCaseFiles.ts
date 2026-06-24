import type { TestCase } from "../testCases.ts";
import type { Structure } from "../writing/writeStructure.ts";
import { createESLintConfigFile } from "./files/createESLintConfigFile.ts";
import { createFlintConfigFile } from "./files/createFlintConfigFile.ts";
import { createStandardTSConfigFile } from "./files/createStandardTSConfigFile.ts";
import { range } from "./utils.ts";

export function createCaseFiles(testCase: TestCase): Structure {
	const topLevelWidth = Math.max(1, Math.floor(Math.log(testCase.files) * 1.7));

	return {
		"eslint.config.js": [createESLintConfigFile(testCase.rules), "typescript"],
		"flint.config.ts": [createFlintConfigFile(testCase.rules), "typescript"],
		src: {
			"index.ts": [createIndexFile(topLevelWidth), "typescript"],
			...Object.fromEntries(
				new Array(topLevelWidth)
					.fill(undefined)
					.map((_, index) => [
						`example${index}`,
						createExampleDirectory(index),
					]),
			),
		},
		"tsconfig.json": [createStandardTSConfigFile(), "json"],
	};
}

function createExampleDirectory(index: number): Structure {
	return {
		"index.ts": [createExampleFile(index), "typescript"],
		...(index > 2 &&
			Object.fromEntries(
				range(1, index).map((i) => [
					`nested${i}`,
					createExampleDirectory(i - 1),
				]),
			)),
	};
}

function createExampleFile(index: number) {
	return [
		index > 1 &&
			range(1, index)
				.map((i) => `export * as nested${i} from "./nested${i}/index.js";`)
				.join("\n\t\t"),
		`
			export async function example${index}(prefix: string) {
				await Promise.resolve();
				return [prefix + "", ${index}];
			}
		`,
	]
		.filter(Boolean)
		.join("\n\n");
}

function createIndexFile(topLevelWidth: number) {
	const indices = range(0, topLevelWidth);

	return `
		import { example0 } from "./example0/index.ts";
		
		export async function root() {
			// Lint report: ts/forInArrays
			for (const i in await example0("")) {}
			
			// No lint report
			for (const i of await example0("")) {}
		}

		${indices.map((index) => `export { example${index} } from "./example${index}/index.js";`).join("\n\t\t")}
	`;
}
