import { describe, expect, it } from "vitest";

import { normalizeOutput, runFlint } from "../utils.ts";

const cwd = import.meta.dirname;

describe("cspell", () => {
	it("should find spelling errors across multiple file types", async () => {
		const { exitCode, stdout } = await runFlint(cwd);

		expect(exitCode).toBe(1);
		// cspell:disable
		expect(normalizeOutput(stdout, cwd)).toMatchInlineSnapshot(`
			"<dim>Linting with <cyan><bold>flint.config.ts</bold></fg><dim>...</fg>

			<underline><cwd>/fixtures/CONTRIBUTING.md</underline>
			<dim>  3:50</fg>   Forbidden or unknown word: "projet".      <yellow>spelling/cspell</fg>
			<dim>  7:14</fg>   Forbidden or unknown word: "repositry".   <yellow>spelling/cspell</fg>
			<dim>  13:37</fg>  Forbidden or unknown word: "establised".  <yellow>spelling/cspell</fg>

			<underline><cwd>/fixtures/src/config.json</underline>
			<dim>  3:3</fg>  Forbidden or unknown word: "descripion".  <yellow>spelling/cspell</fg>

			<underline><cwd>/fixtures/src/utils.ts</underline>
			<dim>  3:9</fg>    Forbidden or unknown word: "functon".     <yellow>spelling/cspell</fg>
			<dim>  10:19</fg>  Forbidden or unknown word: "diference".   <yellow>spelling/cspell</fg>
			<dim>  12:17</fg>  Forbidden or unknown word: "diffarence".  <yellow>spelling/cspell</fg>

			<red>✖ Found <bold>7 reports</bold> across <bold>3 files</bold>.</fg>
			<red></fg>
			<dim>Finished in <time> on 4 files with 1 rule.</fg>
			<dim></fg>"
		`);
		// cspell:enable
	});
});
