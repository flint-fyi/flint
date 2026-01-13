import type * as ts from "typescript";

export function createTypeScriptFileFromProjectService(
	filePathAbsolute: string,
	program: ts.Program,
	service: ts.server.ProjectService,
) {
	const sourceFile = program.getSourceFile(filePathAbsolute);
	if (!sourceFile) {
		throw new Error(`Could not retrieve source file for: ${filePathAbsolute}`);
	}

	return {
		program,
		sourceFile,
		[Symbol.dispose]() {
			service.closeClientFile(filePathAbsolute);
		},
	};
}
