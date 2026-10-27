import { describe, expect, it } from "vitest";

import { normalizeOutput, runFlint } from "../utils.ts";

const cwd = import.meta.dirname;

describe("directives", () => {
	it("should apply disable-next-line directives around comment and code reports", async () => {
		const { exitCode, stdout } = await runFlint(cwd);

		expect(exitCode).toBe(1);
		// cspell:disable
		expect(normalizeOutput(stdout, cwd)).toMatchInlineSnapshot(`
			"<grey>Linting with <cyan><bold>flint.config.ts</bold><grey>...</fg>

			<underline><cwd>/fixtures/src/empty-line-boundary.ts</underline>
			<grey>  1:1</fg>  The flint-disable-next-line comment directive selecting "spelling/cspell" did not match any reports.  <yellow>commentDirectiveUnused</fg>
			<grey>  3:4</fg>  Forbidden or unknown word: "functon".                                                                 <yellow>spelling/cspell</fg>

			<underline><cwd>/fixtures/src/unsuppressed-code.ts</underline>
			<grey>  2:2</fg>  Debugger statements should not be used in production code.  <yellow>ts/debuggerStatements</fg>

			<underline><cwd>/fixtures/src/unsuppressed-comment.ts</underline>
			<grey>  1:4</fg>  Forbidden or unknown word: "functon".  <yellow>spelling/cspell</fg>

			<red>✖ Found <bold>4 reports</bold> across <bold>3 files</bold>.
			</fg>
			<grey>Finished in <time> on 4 files with 138 rules.
			</fg>"
		`);
		// cspell:enable
	});
});
