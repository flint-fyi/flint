import type { LinterHost } from "@flint.fyi/core";

const candidatesOrdered = [
	"flint.config.ts",
	"flint.config.mts",
	"flint.config.cts",
	"flint.config.mjs",
	"flint.config.cjs",
	"flint.config.js",
];

export function findConfigFileName(host: LinterHost) {
	const children = new Set(
		host.readDirectory(host.getCurrentDirectory()).map((file) => file.name),
	);

	const fileName = candidatesOrdered.find((candidate) =>
		children.has(candidate),
	);

	return fileName;
}
