import type { OptionsValues } from "../options.ts";
import type { PresenterFactory } from "./types.ts";

export async function getPresenterFactory(
	values: Pick<OptionsValues, "interactive" | "presenter">,
): Promise<PresenterFactory> {
	const presenterName = values.presenter ?? getDefaultPresenterName(values);

	switch (presenterName) {
		case "brief":
			return (await import("./briefPresenterFactory.ts")).briefPresenterFactory;
		case "detailed":
			return (await import("./detailed/detailedPresenterFactory.ts"))
				.detailedPresenterFactory;
		case "github":
			return (await import("./githubPresenterFactory.ts"))
				.githubPresenterFactory;
		default:
			throw new Error(`Unknown --presenter: ${presenterName}`);
	}
}

function getDefaultPresenterName(values: Pick<OptionsValues, "interactive">) {
	if (values.interactive) {
		return "detailed";
	}

	if (process.env.GITHUB_ACTIONS === "true") {
		return "github";
	}

	return "brief";
}
