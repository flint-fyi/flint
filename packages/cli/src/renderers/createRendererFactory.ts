import type { LinterHost } from "@flint.fyi/core";

import type { OptionsValues } from "../options.ts";
import { getPresenterFactory } from "../presenters/getPresenterFactory.ts";
import type { Renderer } from "./types.ts";

export type RendererFactory = () => Renderer;

export async function createRendererFactory(
	host: LinterHost,
	configFileName: string,
	values: OptionsValues,
): Promise<RendererFactory> {
	const presenterFactory = await getPresenterFactory(values);
	const rendererFactory = values.interactive
		? (await import("./interactive/interactiveRendererFactory.ts"))
				.interactiveRendererFactory
		: (await import("./singleRendererFactory.ts")).singleRendererFactory;

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
