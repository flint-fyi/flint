import chalk from "chalk";

export function printControls(file: number, files: number): string {
	return [
		"   ",
		chalk.hex(file === 0 ? "#aaaaaa" : "#dddddd")("[<] previous file"),
		"  ",
		chalk.hex(file === files - 1 ? "#aaaaaa" : "#dddddd")("[>] next file"),
		"  ",
		chalk.hex("#aaaaaa")("[q] quit"),
	].join("");
}
