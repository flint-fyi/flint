import type { SpanMap } from "typescript-native/unstable/ast";
import type {
	Program,
	Project,
	Snapshot,
} from "typescript-native/unstable/sync";

import type { LinterHost } from "@flint.fyi/core";

import type * as AST from "./ast.ts";
import type { Checker } from "./checker.ts";

export interface TypeScriptFileServices {
	host: LinterHost;
	program: Program;
	project: Project;
	snapshot: Snapshot;
	sourceFile: AST.SourceFile;
	spanMap: SpanMap | undefined;
	typeChecker: Checker;
}
