import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import type { PresenterFactory } from "../presenters/types.ts";

const directory = process.argv[2];
if (!directory) {
	throw new Error("Expected a directory containing the built presenter.");
}

Object.defineProperty(process.stdout, "columns", { value: 100 });

const filename = (await readdir(directory)).find((name) =>
	name.startsWith("detailedPresenterFactory-"),
);
if (!filename) {
	throw new Error("Missing detailed presenter chunk.");
}

const { detailedPresenterFactory } = (await import(
	pathToFileURL(path.join(directory, filename)).href
)) as { detailedPresenterFactory: PresenterFactory };
const presenter = detailedPresenterFactory.initialize({
	configFileName: "flint.config.ts",
	ignoreCache: true,
	runMode: "single-run",
});
const results: string[] = [];

for (const text of [
	'const greeting: string = "Hello, 世界 👋";',
	"/* multiline\n * comment */\nconst café = `value ${1 + 2}`;",
	"\tfunction identity<T>(value: T): T {\n\t\treturn value;\n\t}",
	"const pattern = /(?:ab)+/giu;\r\n// comment\r\nconst number = 1_234n;",
	'const text = "\\u001b[31m";\n\nconst other = true;',
	'const text = "\u001b[31m"; // embedded escape',
]) {
	const lines = text.split("\n");
	results.push(
		(
			await Array.fromAsync(
				presenter.renderFile({
					file: { filePath: "fixture.ts", text },
					reports: [
						{
							about: { id: "test/example" },
							message: {
								primary: "Example diagnostic",
								secondary: ["Secondary explanation."],
								suggestions: ["Try another value."],
							},
							range: {
								begin: { column: 0, line: 0, raw: 0 },
								end: {
									column: text.length - text.lastIndexOf("\n") - 1,
									line: lines.length - 1,
									raw: text.length,
								},
							},
						},
					],
				}),
			)
		).join(""),
	);
}

process.stdout.write(JSON.stringify(results));
