import { describe, expect, it, vi } from "vitest";

import type { LinterHost } from "../index.ts";
import { withRepositoryRoot } from "./withRepositoryRoot.ts";

describe(withRepositoryRoot, () => {
	it("overrides getRepositoryRoot and passes everything else through", () => {
		const baseGetRepositoryRoot = vi.fn(() => "/base/root");
		const baseHost = {
			getCurrentDirectory: () => "/root/packages/example",
			getRepositoryRoot: baseGetRepositoryRoot,
			readFileSync: vi.fn(() => "contents"),
		} as unknown as LinterHost;

		const host = withRepositoryRoot(baseHost, "/root");

		expect(host.getRepositoryRoot()).toBe("/root");
		expect(baseGetRepositoryRoot).not.toHaveBeenCalled();

		expect(host.getCurrentDirectory()).toBe("/root/packages/example");
		expect(host.readFileSync("/file")).toBe("contents");
	});

	it("normalizes the repository root path", () => {
		const baseHost = {} as LinterHost;

		const host = withRepositoryRoot(baseHost, "C:\\root\\repo");

		expect(host.getRepositoryRoot()).toBe("C:/root/repo");
	});
});
