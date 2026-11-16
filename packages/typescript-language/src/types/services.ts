import type { Program } from "typescript";

import type * as AST from "./ast.ts";
import type { Checker } from "./checker.ts";

export interface TypeScriptFileServices {
	program: Program;
	projectConfigFilePaths?: string[];
	sourceFile: AST.SourceFile;
	typeChecker: Checker;
}
