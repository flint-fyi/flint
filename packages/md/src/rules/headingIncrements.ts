import { markdownLanguage } from "../language.ts";
import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(markdownLanguage, {
	about: {
		description: "Reports heading levels incrementing by more than one.",
		id: "headingIncrements",
		presets: ["logical"],
	},
	messages: {
		levelSkip: {
			primary:
				"This heading level {{ level }} skips more than one level from the previous heading level of {{ previous }}.",
			secondary: [
				"Heading levels describe the organization and structure of a Markdown document.",
				"When increasing the level of a heading from its parent, the level should only ever increment by one.",
				"Skipping heading ranks can be confusing -especially for automated tools and screen-readers- and should be avoided where possible.",
			],
			suggestions: ["TODO"],
		},
	},
	setup(context) {
		let previousDepth = 0;

		return {
			visitors: {
				heading(node) {
					if (previousDepth && node.depth > previousDepth + 1) {
						const begin = node.position.start.offset;

						context.report({
							data: {
								level: node.depth,
								previous: previousDepth,
							},
							message: "levelSkip",
							range: {
								begin,
								end: begin + node.depth,
							},
						});
					}

					previousDepth = node.depth;
				},
			},
		};
	},
});
