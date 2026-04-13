import {
	getPositionOfColumnAndLine,
	type SourceFileWithLineMap,
} from "@flint.fyi/core";
import { svelteLanguage } from "@flint.fyi/svelte-language";
import { reportSourceCode } from "@flint.fyi/volar-language";
import type { AST } from "svelte/compiler";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(svelteLanguage, {
	about: {
		description:
			"Reports raw special Svelte elements that should use the `svelte:` prefix.",
		id: "rawSpecialElements",
		preset: "logical",
	},
	messages: {
		rawSpecialElement: {
			primary:
				"Use `svelte:{{ element }}` instead of raw `{{ element }}` for this special Svelte element.",
			secondary: [
				"These elements are special in Svelte and must be written with the `svelte:` prefix.",
				"The raw element form worked in older Svelte versions but is invalid in Svelte 5.",
			],
			suggestions: ["Prefix the special element with `svelte:`."],
		},
	},
	setup(context) {
		return {
			visitors: {
				SourceFile(node, services) {
					if (services.svelte == null) {
						return;
					}
					const sourceText: SourceFileWithLineMap = {
						text: services.svelte.sourceText,
					};
					function visit(
						node:
							| AST.Block
							| AST.Comment
							| AST.ElementLike
							| AST.Tag
							| AST.Text,
					) {
						if (node.type === "RegularElement") {
							switch (node.name) {
								case "body":
								case "document":
								case "element":
								case "head":
								case "options":
								case "window":
									reportSourceCode(context, {
										data: {
											element: node.name,
										},
										message: "rawSpecialElement",
										range: {
											begin: getPositionOfColumnAndLine(sourceText, {
												column: node.name_loc.start.column,
												line: node.name_loc.start.line - 1,
											}),
											end: getPositionOfColumnAndLine(sourceText, {
												column: node.name_loc.end.column,
												line: node.name_loc.end.line - 1,
											}),
										},
									});
							}
						}
						if ("fragment" in node) {
							for (const child of node.fragment.nodes) {
								visit(child);
							}
						}
					}
					for (const child of services.svelte.ast.fragment.nodes) {
						visit(child);
					}
				},
			},
		};
	},
});
