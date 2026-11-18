import { definePlugin, type ExpressiveCodePlugin } from "@expressive-code/core";
import { h } from "@expressive-code/core/hast";

// OSC 8 terminal hyperlinks are written as: ESC ] 8 ; ; URL BEL text ESC ] 8 ; ; BEL
const linkOpen = "\x1B]8;;";
const linkTerminator = "\x07";
const linkClose = linkOpen + linkTerminator;

/**
 * Turns OSC 8 terminal hyperlinks in `ansi` code blocks into anchor elements.
 */
export function pluginAnsiLinks(): ExpressiveCodePlugin {
	return definePlugin({
		hooks: {
			preprocessCode({ codeBlock }) {
				if (codeBlock.language !== "ansi") {
					return;
				}

				for (const line of codeBlock.getLines()) {
					let start = line.text.indexOf(linkOpen);
					while (start !== -1) {
						const hrefEnd = line.text.indexOf(linkTerminator, start);
						const textEnd = line.text.indexOf(linkClose, hrefEnd);
						const href = line.text.slice(start + linkOpen.length, hrefEnd);
						const text = line.text.slice(hrefEnd + 1, textEnd);
						line.editText(start, textEnd + linkClose.length, text);
						line.addAnnotation({
							inlineRange: {
								columnEnd: start + text.length,
								columnStart: start,
							},
							render: ({ nodesToTransform }) =>
								nodesToTransform.map((node) => h("a", { href }, node)),
						});
						start = line.text.indexOf(linkOpen, start + text.length);
					}
				}
			},
		},
		name: "ANSI links",
	});
}
