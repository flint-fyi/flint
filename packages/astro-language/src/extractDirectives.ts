import type { Node, RootNode } from "@astrojs/compiler/types";

import type { SourceFileWithLineMap } from "@flint.fyi/core";
import type { ExtractedDirective } from "@flint.fyi/typescript-language";
import { nullThrows } from "@flint.fyi/utils";

import { getAstroPointOffset } from "./getAstroPointOffset.ts";

export function extractDirectives(
	ast: RootNode,
	source: SourceFileWithLineMap,
): ExtractedDirective[] {
	const directives: ExtractedDirective[] = [];

	function visit(node: Node) {
		if ("children" in node) {
			for (const child of node.children) {
				visit(child);
			}
			return;
		}
		if (node.type !== "comment") {
			return;
		}
		const match = /(\s*)(flint-(\S+)(?:\s+(.+))?)/.exec(node.value);
		if (match == null) {
			return;
		}
		const [, space, directive, type, selection] = match;
		const spaceLen = nullThrows(
			space,
			"Expected RegExp to provide first capturing group",
		).length;
		const directiveLen = nullThrows(
			directive,
			"Expected RegExp to provide second capturing group",
		).trimEnd().length;
		const position = nullThrows(
			node.position,
			"Expected node.position to be defined",
		);
		const end = nullThrows(
			position.end,
			"Expected node.position.end to be defined",
		);
		const start = getAstroPointOffset(source, position.start);
		directives.push({
			range: {
				begin: {
					column: position.start.column - 1 + spaceLen,
					line: position.start.line - 1,
					raw: start + spaceLen,
				},
				end:
					end.line === position.start.line
						? {
								column: position.start.column - 1 + spaceLen + directiveLen,
								line: end.line - 1,
								raw: start + spaceLen + directiveLen,
							}
						: {
								column: end.column - 1,
								line: end.line - 1,
								raw: getAstroPointOffset(source, end),
							},
			},
			selection: nullThrows(
				selection,
				"Expected RegExp to provide third capturing group",
			),
			type: nullThrows(
				type,
				"Expected RegExp to provide fourth capturing group",
			),
		});
	}

	for (const child of ast.children) {
		visit(child);
	}

	return directives;
}
