import type { LinterHost } from "@flint.fyi/core";

import type { OptionsValues } from "../options.ts";
import { getPresenterFactory } from "../presenters/getPresenterFactory.ts";
import { interactiveRendererFactory } from "./interactive/interactiveRendererFactory.ts";
import { singleRendererFactory } from "./singleRendererFactory.ts";

export function createRendererFactory(
	host: LinterHost,
	configFileName: string,
	values: OptionsValues,
) {
	const presenterFactory = getPresenterFactory(values);
	const rendererFactory = values.interactive
		? interactiveRendererFactory
		: singleRendererFactory;

	return () =>
		rendererFactory.initialize(
			host,
			presenterFactory.initialize({
				configFileName,
				ignoreCache: !!values["cache-ignore"],
				runMode: values.watch ? "watch" : "single-run",
			}),
		);
}
