import { describe, expect, it } from "vitest";

import { normalizeOutput, runFlint } from "../utils.ts";

const cwd = import.meta.dirname;

describe("typescript", () => {
	it("should find TypeScript lint issues", async () => {
		const { exitCode, stdout } = await runFlint(cwd);

		expect(exitCode).toBe(1);
		expect(normalizeOutput(stdout, cwd)).toMatchInlineSnapshot(`
			"<grey>Linting with <cyan><bold>flint.config.ts</bold><grey>...</fg>

			<underline><cwd>/fixtures/src/cycle-a.ts</underline>
			<grey>  1:8</fg>  Circular module dependency: fixtures/src/cycle-a.ts → fixtures/src/cycle-b.ts → fixtures/src/cycle-a.ts.  <yellow>ts/importCycles</fg>

			<underline><cwd>/fixtures/src/with-issues.ts</underline>
			<grey>  2:2</fg>  Debugger statements should not be used in production code.  <yellow>ts/debuggerStatements</fg>

			<red>✖ Found <bold>2 reports</bold> across <bold>2 files</bold>.
			</fg>
			<grey>Finished in <time> on 4 files with 138 rules.
			</fg>"
		`);
	});
});
