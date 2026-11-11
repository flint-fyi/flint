import { describe, expect, it } from "vitest";

import { serverFS } from "./native/fs.ts";
import { API } from "./native/sync.ts";

describe("TypeScript native API", () => {
	it("creates and checks a program", () => {
		const api = new API({
			cwd: "/repo",
			fs: {
				directoryExists: serverFS.useOS,
				fileExists: (fileName) => fileName === "/repo/index.ts",
				getAccessibleEntries: serverFS.useOS,
				readFile: (fileName) =>
					fileName === "/repo/index.ts"
						? "const value: string = 1;"
						: undefined,
				realpath: serverFS.useOS,
				removeFile: serverFS.useOS,
				stat: serverFS.useOS,
				writeFile: serverFS.useOS,
			},
		});
		const program = api.createProgram(["/repo/index.ts"], {
			noLib: true,
			strict: true,
		});

		try {
			expect(program.getSemanticDiagnostics()).toHaveLength(1);
		} finally {
			program.dispose();
			api.close();
		}
	});
});
