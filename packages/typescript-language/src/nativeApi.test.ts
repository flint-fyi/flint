import { API } from "typescript-native/unstable/sync";
import { describe, expect, it } from "vitest";

describe("TypeScript native API", () => {
	it("creates and checks a program", () => {
		const api = new API({
			cwd: "/repo",
			fs: {
				fileExists: (fileName) => fileName === "/repo/index.ts",
				readFile: (fileName) =>
					fileName === "/repo/index.ts" ? "const value: string = 1;" : null,
			},
		});
		const program = api.createProgram(["/repo/index.ts"], {
			compilerOptions: { noLib: true, strict: true },
		});

		try {
			expect(program.getSemanticDiagnostics()).toHaveLength(1);
		} finally {
			program.dispose();
			api.close();
		}
	});
});
