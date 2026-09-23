import { afterEach, expect, it, vi } from "vitest";

import { printControls } from "./printControls.ts";

afterEach(() => {
	vi.unstubAllEnvs();
});

it.each([
	[0, "170;170;170", "221;221;221"],
	[2, "221;221;221", "170;170;170"],
])(
	"printControls dims unavailable navigation at file %i",
	(file, previous, next) => {
		vi.stubEnv("FORCE_COLOR", "3");
		vi.stubEnv("NO_COLOR", undefined);
		vi.stubEnv("NODE_DISABLE_COLORS", undefined);
		const output = printControls(file, 3);

		expect(output).toContain(
			`\u001B[38;2;${previous}m[<] previous file\u001B[39m`,
		);
		expect(output).toContain(`\u001B[38;2;${next}m[>] next file\u001B[39m`);
	},
);
