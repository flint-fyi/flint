import type { Program } from "typescript";

import type * as AST from "./ast.ts";
import type { Checker } from "./checker.ts";

export interface TypeScriptFileServices {
	filePath: string;
	program: Program;
	sourceFile: AST.SourceFile;
	typeChecker: Checker;
}
