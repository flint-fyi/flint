import { describe, expect, it } from "vitest";

import { normalizeOutput, runFlint } from "../utils.ts";

const cwd = import.meta.dirname;

describe("typescript", () => {
	it("should find TypeScript lint issues", async () => {
		const { exitCode, stdout } = await runFlint(cwd);

		expect(exitCode).toBe(1);
		expect(normalizeOutput(stdout, cwd)).toMatchInlineSnapshot(`
			"<dim>Linting with <cyan><bold>flint.config.ts</bold></fg><dim>...</fg>

			<underline><cwd>/fixtures/src/redundant-directive.ts</underline>
			<dim>  2:1</fg>  The selection "ts/debuggerStatements" is already disabled by a previous flint-disable-file comment directive.  <yellow>commentDirectiveAlreadyDisabled</fg>

			<underline><cwd>/fixtures/src/with-issues.ts</underline>
			<dim>  2:2</fg>  Debugger statements should not be used in production code.  <yellow>ts/debuggerStatements</fg>

			<red>✖ Found <bold>2 reports</bold> across <bold>2 files</bold>.</fg>
			<red></fg>
			<dim>Finished in <time> on 3 files with 137 rules.</fg>
			<dim></fg>"
		`);
	});
});
