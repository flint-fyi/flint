import { describe, expect, it } from "vitest";

import { normalizeOutput, runFlint } from "../utils.ts";

const cwd = import.meta.dirname;

describe("typescript", () => {
	it("should find TypeScript lint issues", async () => {
		const { exitCode, stdout } = await runFlint(cwd);

		expect(exitCode).toBe(1);
		expect(normalizeOutput(stdout, cwd)).toMatchInlineSnapshot(`
			"<dim>Linting with <cyan><bold>flint.config.ts</bold></fg><dim>...</fg>

			<underline><cwd>/fixtures/src/type-exports.ts</underline>
			<dim>  6:1</fg>  All exports in this declaration are types. Use \`export type\`.  <yellow>ts/typeExports</fg>

			<underline><cwd>/fixtures/src/with-issues.ts</underline>
			<dim>  2:2</fg>  Debugger statements should not be used in production code.  <yellow>ts/debuggerStatements</fg>

			<red>✖ Found <bold>2 reports</bold> across <bold>2 files</bold> (<bold>1 fixable with --fix</bold>).</fg>
			<red></fg>
			<dim>Finished in <time> on 3 files with 139 rules.</fg>
			<dim></fg>"
		`);
	});
});
