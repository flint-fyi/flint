import { afterEach, expect, it, vi } from "vitest";

import { presentHeader } from "./header.ts";

afterEach(() => {
	vi.unstubAllEnvs();
});

it("presentHeader restores gray after the bold cyan filename", () => {
	vi.stubEnv("FORCE_COLOR", "3");
	vi.stubEnv("NO_COLOR", undefined);
	vi.stubEnv("NODE_DISABLE_COLORS", undefined);
	const output = Array.from(
		presentHeader({
			configFileName: "配置.ts",
			ignoreCache: false,
			runMode: "single-run",
		}),
	).join("");

	expect(output).toBe(
		"\u001B[90mLinting with \u001B[36m\u001B[1m配置.ts\u001B[22m\u001B[90m...\u001B[39m",
	);
});
