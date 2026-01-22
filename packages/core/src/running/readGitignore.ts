import { readFileSafe } from "./readFileSafe.ts";

export async function readGitignore() {
	return ((await readFileSafe(".gitignore")) ?? "")
		.trim()
		.split("\n")
		.filter(Boolean)
		.filter((line) => !line.startsWith("#"))
		.map((line) =>
			line.startsWith("/")
				? line.slice(1)
				: line.includes("/")
					? line
					: `**/${line}`,
		);
}
