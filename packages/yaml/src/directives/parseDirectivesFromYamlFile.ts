import { DirectivesCollector } from "@flint.fyi/core";
import { nullThrows } from "@flint.fyi/utils";
import type * as yamlParser from "yaml-unist-parser";

export function parseDirectivesFromYamlFile(
	root: yamlParser.Root,
	sourceText: string,
) {
	const index = root.children.at(0)?.position.start.offset ?? sourceText.length;
	const collector = new DirectivesCollector(index);

	for (const comment of root.comments) {
		const match = /^\s*flint-(\S+)(?:\s+(.+))?/.exec(comment.value);
		if (!match) {
			break;
		}

		const [type, selection] = match.slice(1);
		collector.add(
			{
				begin: {
					column: comment.position.start.column - 1,
					line: comment.position.start.line - 1,
					raw: comment.position.start.offset,
				},
				end: {
					column: comment.position.end.column - 1,
					line: comment.position.end.line - 1,
					raw: comment.position.end.offset,
				},
			},
			nullThrows(
				selection,
				"Selection is expected to be present by the regex match",
			),
			nullThrows(type, "Type is expected to be present by the regex match"),
		);
	}

	return collector.collect();
}
