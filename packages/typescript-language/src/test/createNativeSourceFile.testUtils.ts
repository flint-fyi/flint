import { serverFS } from "typescript-native/fs";
import { API, JsxEmit } from "typescript-native/sync";

import type * as AST from "../types/ast.ts";

const files = new Map<string, string>();
const activePrograms: Disposable[] = [];
const api = new API({
	cwd: "/repo",
	fs: {
		directoryExists: serverFS.useOS,
		fileExists: (fileName) => files.has(fileName),
		getAccessibleEntries: serverFS.useOS,
		readFile: (fileName) => files.get(fileName),
		realpath: serverFS.useOS,
		removeFile: serverFS.useOS,
		stat: serverFS.useOS,
		writeFile: serverFS.useOS,
	},
});
let fileIndex = 0;

export function createNativeSourceFile(
	sourceText: string,
	extension = ".ts",
): AST.SourceFile {
	const fileName = `/repo/test-${String(fileIndex++)}${extension}`;
	files.set(fileName, sourceText);
	const program = api.createProgram([fileName], {
		allowJs: true,
		jsx: JsxEmit.Preserve,
		noLib: true,
	});
	activePrograms.push(program);
	const sourceFile = program.getSourceFile(fileName);
	if (!sourceFile) {
		throw new Error(`Expected native program to contain ${fileName}.`);
	}
	return sourceFile as unknown as AST.SourceFile;
}
