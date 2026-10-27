import wrapAnsi from "wrap-ansi";

import { indenter } from "./constants.ts";

export function wrapIfNeeded(
	formatLine: (text: string) => string,
	text: string,
	width: number,
): string {
	const lines = wrapAnsi(text, width).split("\n");

	return lines.map(formatLine).join("\n").replaceAll(`\n`, `\n${indenter} `);
}
