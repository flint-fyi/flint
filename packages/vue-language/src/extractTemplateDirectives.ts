import type { ExtractedDirective } from "@flint.fyi/typescript-language";
import { nullThrows } from "@flint.fyi/utils";
import {
	NodeTypes,
	type RootNode,
	type TemplateChildNode,
} from "@vue/compiler-dom";

export function extractTemplateDirectives(ast: RootNode) {
	const directives: ExtractedDirective[] = [];

	function visitTemplate(elem: TemplateChildNode) {
		if (elem.type === NodeTypes.ELEMENT) {
			for (const child of elem.children) {
				visitTemplate(child);
			}
			return;
		}
		if (elem.type !== NodeTypes.COMMENT) {
			return;
		}
		const match = /\s*flint-(\S+)(?:\s+(.+))?/.exec(elem.content);
		if (match == null) {
			return;
		}
		const [, type, selection] = match;
		directives.push({
			range: {
				begin: {
					column: elem.loc.start.column - 1,
					line: elem.loc.start.line - 1,
					raw: elem.loc.start.offset,
				},
				end: {
					column: elem.loc.end.column - 1,
					line: elem.loc.end.line - 1,
					raw: elem.loc.end.offset,
				},
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

	for (const child of ast.children) {
		visitTemplate(child);
	}

	return directives;
}
