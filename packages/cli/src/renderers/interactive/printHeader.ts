import chalk from "chalk";

export function printHeader(file: number, files: number): string {
	return [
		chalk.hex("#aabbee")("📌 Displaying Flint reports in "),
		chalk.hex("#bbccff")("--interactive"),
		chalk.hex("#aabbee")(" mode (file "),
		chalk.hex("#bbccff")(file + 1),
		chalk.hex("#aabbee")(" of "),
		chalk.hex("#aabbee")(files),
		chalk.hex("#aabbee")(")."),
	].join("");
}
