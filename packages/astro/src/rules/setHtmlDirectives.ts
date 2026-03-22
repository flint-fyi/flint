import type { Node } from "@astrojs/compiler/types";
import { astroLanguage } from "@flint.fyi/astro-language";
import { nullThrows } from "@flint.fyi/utils";
import { reportSourceCode } from "@flint.fyi/volar-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(astroLanguage, {
	about: {
		description:
			"Reports using Astro's `set:html` directive, which injects content without escaping.",
		id: "setHtmlDirectives",
		preset: "security",
	},
	messages: {
		// TODO: support import("@flint.fyi/volar-language").reportSourceCode in flint/unusedMessageIds
		// flint-disable-next-line flint/unusedMessageIds
		setHtml: {
			primary: "Avoid using `set:html`. Astro does not escape its value.",
			secondary: [
				"`set:html` behaves similarly to setting `el.innerHTML` and injects content directly into the page.",
				"If the content is not fully trusted or sanitized first, it can introduce cross-site scripting (XSS) vulnerabilities.",
			],
			suggestions: [
				"Prefer normal Astro expressions so content is escaped automatically.",
				"If you need `set:html`, only pass content you trust or have sanitized or escaped first.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				SourceFile(node, services) {
					if (services.astro == null) {
						return;
					}

					function visit(node: Node) {
						if ("attributes" in node) {
							for (const attr of node.attributes) {
								if (attr.name === "set:html") {
									const begin = nullThrows(
										attr.position,
										"Expected attr.position to be defined",
									).start.offset;

									reportSourceCode(context, {
										message: "setHtml",
										range: {
											begin,
											end: begin + attr.name.length,
										},
									});
								}
							}
						}
						if ("children" in node) {
							for (const child of node.children) {
								visit(child);
							}
						}
					}
					for (const child of services.astro.ast.children) {
						visit(child);
					}
				},
			},
		};
	},
});
