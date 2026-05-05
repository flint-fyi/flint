import type { LinterHost } from "@flint.fyi/core";

const candidatesOrdered = [
	"flint.config.ts",
	"flint.config.mts",
	"flint.config.cts",
	"flint.config.mjs",
	"flint.config.cjs",
	"flint.config.js",
];

export async function findConfigFileName(host: LinterHost) {
	const currentDirectoryContents = await host.readDirectory(
		host.getCurrentDirectory(),
	);
	const children = new Set(currentDirectoryContents.map((file) => file.name));

	const fileName = candidatesOrdered.find((candidate) =>
		children.has(candidate),
	);

	return fileName;
}
