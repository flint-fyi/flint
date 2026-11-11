import type { SpanMap } from "../native/ast.ts";
import type { Program, Project, Snapshot } from "../native/sync.ts";
import type * as AST from "./ast.ts";
import type { Checker } from "./checker.ts";

export interface TypeScriptFileServices {
	program: Program;
	project: Project;
	snapshot: Snapshot;
	sourceFile: AST.SourceFile;
	spanMap: SpanMap | undefined;
	typeChecker: Checker;
}
