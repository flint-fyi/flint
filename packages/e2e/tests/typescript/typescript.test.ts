import { describe, expect, it } from "vitest";

import { normalizeOutput, runFlint } from "../utils.ts";

const cwd = import.meta.dirname;

describe("typescript", () => {
	it("should find TypeScript lint issues", async () => {
		const { exitCode, stdout } = await runFlint(cwd);

		expect(exitCode).toBe(1);
		expect(normalizeOutput(stdout, cwd)).toMatchInlineSnapshot(`
			"<dim>Linting with <cyan><bold>flint.config.ts</bold></fg><dim>...</fg>

			<underline><cwd>/fixtures/src/with-issues.ts</underline>
			<dim>  2:2</fg>  Debugger statements should not be used in production code.  <yellow>debuggerStatements</fg>

			<red>✖ Found <bold>1 report</bold> across <bold>1 file</bold>.</fg>
			<red></fg>"
		`);
	});
});
