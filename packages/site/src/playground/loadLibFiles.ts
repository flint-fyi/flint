import { preProcessFile } from "typescript";

const libFileLoaders = import.meta.glob<string>(
	"/node_modules/typescript/lib/lib.*.d.ts",
	{ import: "default", query: "?raw" },
);

/**
 * Loads a TypeScript lib file and, recursively, the lib files it references.
 */
export async function loadLibFiles(
	rootFileName: string,
): Promise<Map<string, string>> {
	const libFiles = new Map<string, string>();
	const loading = new Set<string>();

	async function loadLibFile(fileName: string): Promise<void> {
		if (loading.has(fileName)) {
			return;
		}

		loading.add(fileName);

		const text =
			await libFileLoaders[`/node_modules/typescript/lib/${fileName}`]();
		libFiles.set(fileName, text);

		await Promise.all(
			preProcessFile(text).libReferenceDirectives.map((reference) =>
				loadLibFile(`lib.${reference.fileName.toLowerCase()}.d.ts`),
			),
		);
	}

	await loadLibFile(rootFileName);

	return libFiles;
}
