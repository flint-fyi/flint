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
			<dim>  2:2</fg>    Debugger statements should not be used in production code.                                                                     <yellow>ts/debuggerStatements</fg>
			<dim>  12:10</fg>  Await this returned promise so its rejection is handled before the surrounding error handling or resource disposal completes.  <yellow>ts/returnAwaitPromises</fg>

			<red>✖ Found <bold>2 reports</bold> across <bold>1 file</bold>.</fg>
			<red></fg>
			<dim>Finished in <time> on 2 files with 139 rules.</fg>
			<dim></fg>"
		`);
	});
});
