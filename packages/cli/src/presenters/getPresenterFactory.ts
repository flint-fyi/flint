import type { OptionsValues } from "../options.ts";
import { briefPresenterFactory } from "./briefPresenterFactory.ts";
import { detailedPresenterFactory } from "./detailed/detailedPresenterFactory.ts";
import type { PresenterFactory } from "./types.ts";

export function getPresenterFactory(
	values: Pick<OptionsValues, "interactive" | "presenter">,
): PresenterFactory {
	const presenterName =
		values.presenter ?? (values.interactive ? "detailed" : "brief");

	switch (presenterName) {
		case "brief":
			return briefPresenterFactory;
		case "detailed":
			return detailedPresenterFactory;
		default:
			throw new Error(`Unknown --presenter: ${presenterName}`);
	}
}
