import {
	getColumnAndLineOfPosition,
	type SourceFileWithLineMap,
} from "@flint.fyi/core";
import type { ExtractedDirective } from "@flint.fyi/typescript-language";
import { nullThrows } from "@flint.fyi/utils";
import type { AST } from "svelte/compiler";

export function extractDirectives(
	ast: AST.Root,
	source: SourceFileWithLineMap,
) {
	const directives: ExtractedDirective[] = [];

	function visit(
		node: AST.Block | AST.Comment | AST.ElementLike | AST.Tag | AST.Text,
	) {
		if ("fragment" in node) {
			for (const child of node.fragment.nodes) {
				visit(child);
			}
		}
		if (node.type !== "Comment") {
			return;
		}
		const match = /\s*flint-(\S+)(?:\s+(.+))?/.exec(node.data);
		if (match == null) {
			return;
		}
		const [, type, selection] = match;
		directives.push({
			range: {
				begin: getColumnAndLineOfPosition(source, node.start),
				end: getColumnAndLineOfPosition(source, node.end),
			},
			selection: nullThrows(
				selection,
				"Expected RegExp to provide second capturing group",
			),
			type: nullThrows(
				type,
				"Expected RegExp to provide first capturing group",
			),
		});
	}

	for (const child of ast.fragment.nodes) {
		visit(child);
	}

	return directives;
}
