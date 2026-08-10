import { afterAll, describe, expect, it, vi } from "vitest";

import type { OptionsValues } from "../options.ts";
import { getPresenterFactory } from "./getPresenterFactory.ts";

const briefPresenterFactory = { name: "brief" };
const detailedPresenterFactory = { name: "detailed" };
const githubPresenterFactory = { name: "github" };

vi.mock("./briefPresenterFactory.ts", () => ({
	briefPresenterFactory,
}));

vi.mock("./detailed/detailedPresenterFactory.ts", () => ({
	detailedPresenterFactory,
}));

vi.mock("./githubPresenterFactory.ts", () => ({
	githubPresenterFactory,
}));

describe(getPresenterFactory, () => {
	const originalGithubActions = process.env.GITHUB_ACTIONS;

	afterAll(() => {
		process.env.GITHUB_ACTIONS = originalGithubActions;
	});

	it("should use the brief presenter by default for non-interactive runs", async () => {
		process.env.GITHUB_ACTIONS = undefined;

		await expect(getPresenterFactory({ interactive: false })).resolves.toBe(
			briefPresenterFactory,
		);
	});

	it("should use the detailed presenter when interactive mode is enabled", async () => {
		process.env.GITHUB_ACTIONS = undefined;

		await expect(getPresenterFactory({ interactive: true })).resolves.toBe(
			detailedPresenterFactory,
		);
	});

	it("should use the github presenter when running in GitHub Actions", async () => {
		process.env.GITHUB_ACTIONS = "true";

		await expect(getPresenterFactory({ interactive: false })).resolves.toBe(
			githubPresenterFactory,
		);
	});

	it.each([
		["brief", briefPresenterFactory],
		["detailed", detailedPresenterFactory],
		["github", githubPresenterFactory],
	] as const)(
		"should use the %s presenter when it is explicitly requested",
		async (presenterName, expectedFactory) => {
			await expect(
				getPresenterFactory({
					interactive: true,
					presenter: presenterName,
				}),
			).resolves.toBe(expectedFactory);
		},
	);

	it("should throw for unsupported presenter names", async () => {
		const values = {
			interactive: false,
			presenter: "unknown",
		} as Pick<OptionsValues, "interactive" | "presenter">;

		await expect(getPresenterFactory(values)).rejects.toThrow(
			"Unknown --presenter: unknown",
		);
	});
});
