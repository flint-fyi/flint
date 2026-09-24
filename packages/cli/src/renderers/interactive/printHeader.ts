import { styleText } from "node:util";

export function printHeader(file: number, files: number): string {
	return [
		styleText("#aabbee", "📌 Displaying Flint reports in "),
		styleText("#bbccff", "--interactive"),
		styleText("#aabbee", " mode (file "),
		styleText("#bbccff", String(file + 1)),
		styleText("#aabbee", " of "),
		styleText("#aabbee", String(files)),
		styleText("#aabbee", ")."),
	].join("");
}
