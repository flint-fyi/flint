import { NodeHandle, type Program } from "typescript-native/sync";

import type * as AST from "../types/ast.ts";

/**
 * Whether a declaration is in a default library file, such as `lib.dom.d.ts`.
 * A handle is judged from its path, without fetching its file's syntax tree.
 */
export function declarationIncludesGlobal(
	declaration: AST.Declaration | NodeHandle,
	program: Program,
): boolean {
	const path =
		declaration instanceof NodeHandle
			? declaration.path
			: declaration.getSourceFile().path;
	return (
		!!program.getSourceFileMetadataByPath(path)?.isDefaultLibrary ||
		/\/lib\.[^/]*\.d\.ts$/.test(path)
	);
}
