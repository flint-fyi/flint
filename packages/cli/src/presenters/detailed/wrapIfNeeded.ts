import type { ChalkInstance } from "chalk";
import wrapAnsi from "wrap-ansi";

import { indenter } from "./constants.ts";

export function wrapIfNeeded(
	lineFormat: ChalkInstance,
	text: string,
	width: number,
) {
	const lines = wrapAnsi(text, width).split("\n");

	return [
		lineFormat(lines[0]),
		...lines.slice(1).map((line) => lineFormat(line)),
	]
		.join("\n")
		.replaceAll(`\n`, `\n${indenter} `);
}
