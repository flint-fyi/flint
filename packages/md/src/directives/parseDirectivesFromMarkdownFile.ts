import { DirectivesCollector } from "@flint.fyi/core";
import { nullThrows } from "@flint.fyi/utils";
import type { Root } from "mdast";
import { visit } from "unist-util-visit";

export function parseDirectivesFromMarkdownFile(
	root: Root,
	sourceText: string,
) {
	const index =
		root.children.find((child) => child.position?.start.offset !== undefined)
			?.position?.start.offset ?? sourceText.length;
	const collector = new DirectivesCollector(index);

	visit(root, "html", (node) => {
		const regex = /<!--([\s\S]*?)-->/g;
		let commentMatch: null | RegExpExecArray;
		while ((commentMatch = regex.exec(node.value)) !== null) {
			const directiveMatch = /^\s*flint-(\S+)(?:\s+(.+))?/.exec(
				nullThrows(
					commentMatch[1],
					"Directive match is expected to be present by the regex match",
				),
			);
			if (!directiveMatch) {
				return;
			}

			const position = nullThrows(
				node.position,
				"Node position is expected to be present",
			);

			const [type, selection] = directiveMatch.slice(1);
			collector.add(
				{
					begin: {
						column: position.start.column - 1,
						line: position.start.line - 1,
						raw: nullThrows(
							position.start.offset,
							"Node start offset is expected to be present",
						),
					},
					end: {
						column: position.end.column - 1,
						line: position.end.line - 1,
						raw: nullThrows(
							position.end.offset,
							"Node end offset is expected to be present",
						),
					},
				},
				nullThrows(
					selection,
					"Selection is expected to be present by the regex match",
				),
				nullThrows(type, "Type is expected to be present by the regex match"),
			);
		}
	});

	return collector.collect();
}
