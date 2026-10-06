import { createCli } from "parse-standard-args";

import { addFlintAssertionContext } from "@flint.fyi/utils";

import packageData from "../package.json" with { type: "json" };
import { options } from "./options.ts";

const cli = createCli({
	description:
		"Welcome to Flint!\nFlint is still very early stage and experimental.",
	footer:
		"See \u{1B}]8;;flint.fyi\u{7}flint.fyi\u{1B}]8;;\u{7} for more information.",
	name: "flint",
	options,
	version: packageData.version,
});

export async function runCli(args: string[]): Promise<number> {
	const parsed = await cli.parse(args);

	switch (parsed.type) {
		case "error":
			console.error(parsed.text);
			return 2;

		case "help":
		case "version":
			console.log(parsed.text);
			return 0;
	}

	const { values } = parsed;

	try {
		const [
			{ createEphemeralLinterHost, findConfigFileName },
			{ createDiskBackedLinterHost },
		] = await Promise.all([
			import("@flint.fyi/core"),
			import("@flint.fyi/core/node"),
		]);

		const host = createDiskBackedLinterHost(process.cwd());
		const cwd = host.getCurrentDirectory();
		const configFileName = await findConfigFileName(host);
		if (!configFileName) {
			console.error(`No flint.config.* file found in ${cwd}.`);
			console.error(
				"The Flint CLI auto-initializer is not yet implemented. Check back soon!",
			);
			console.error(
				`In the meantime, why not join \u{1B}]8;;https://flint.fyi/discord\u{7}flint.fyi/discord\u{1B}]8;;\u{7} and chat with us? ❤️`,
			);
			return 2;
		}

		const { createRendererFactory } =
			await import("./renderers/createRendererFactory.ts");
		const getRenderer = await createRendererFactory(
			host,
			configFileName,
			values,
		);

		if (values.watch) {
			const { runCliWatch } = await import("./runCliWatch.ts");
			await runCliWatch(host, configFileName, getRenderer, values, args);
			console.log("👋 Thanks for using Flint!");
			return 0;
		}

		const { runCliOnce } = await import("./runCliOnce.ts");
		const renderer = getRenderer();
		try {
			const { exitCode } = await runCliOnce(
				createEphemeralLinterHost(host),
				configFileName,
				renderer,
				values,
			);

			return exitCode;
		} finally {
			renderer.dispose?.();
		}
	} catch (error) {
		throw addFlintAssertionContext(error, args);
	}
}
