import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { pathKey } from "@flint.fyi/utils";

import { createVFSLinterHost } from "../host/createVFSLinterHost.ts";
import { createLanguage } from "../languages/createLanguage.ts";
import { finalizeFileResults } from "./finalizeFileResults.ts";

describe("finalizeFileResults", () => {
	it.each([true, false])(
		"roots dependencies at host cwd with caseSensitive=%s",
		(caseSensitive) => {
			const cwd = resolve("HostProject");
			const host = createVFSLinterHost({ caseSensitive, cwd });
			const absoluteDependency = resolve("Shared", "types.ts");
			const language = createLanguage({
				about: { name: "test" },
				createFileFactory: () => ({
					createFile: (about) => ({ about, services: {} }),
				}),
				getFileCacheImpacts: () => ({
					dependencies: [
						"tsconfig.json",
						"src/../src/Dependency.ts",
						"src/Dependency.ts",
						absoluteDependency,
					],
					invalidatesCache: false,
				}),
				runFileVisitors: () => undefined,
			});
			using file = language.createFileFactory(host).createFile({
				filePath: "src/index.ts",
				filePathAbsolute: resolve(cwd, "src/index.ts"),
				sourceText: "",
			});

			expect(cwd).not.toBe(process.cwd());
			expect(
				finalizeFileResults(file.about.filePath, [{ file, language }], [], host)
					.dependencies,
			).toEqual(
				new Set(
					[
						resolve(cwd, "tsconfig.json"),
						resolve(cwd, "src/Dependency.ts"),
						absoluteDependency,
					].map((dependency) => pathKey(dependency, caseSensitive)),
				),
			);
		},
	);
});
