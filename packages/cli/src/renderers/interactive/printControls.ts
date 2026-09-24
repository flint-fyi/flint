import { styleText } from "node:util";

export function printControls(file: number, files: number): string {
	return [
		" ".repeat(3),
		styleText(file === 0 ? "#aaaaaa" : "#dddddd", "[<] previous file"),
		"  ",
		styleText(file === files - 1 ? "#aaaaaa" : "#dddddd", "[>] next file"),
		"  ",
		styleText("#aaaaaa", "[q] quit"),
	].join("");
}
