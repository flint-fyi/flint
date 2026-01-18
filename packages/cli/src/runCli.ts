import { parseArgs } from "node:util";

import packageData from "../package.json" with { type: "json" };
import { findConfigFileName } from "./findConfigFileName.ts";
import { options } from "./options.ts";
import { createRendererFactory } from "./renderers/createRendererFactory.ts";
import { runCliOnce } from "./runCliOnce.ts";
import { runCliWatch } from "./runCliWatch.ts";

export async function runCli(args: string[]) {
	const { values } = parseArgs({
		args,
		options,
		strict: true,
	});

	if (values.help) {
		console.log("Welcome to Flint!");
		console.log("Flint is still very early stage and experimental.");
		console.log("");
		console.log("Options:");
		console.log("");
		console.log("  --cache-ignore");
		console.log(
			"    Whether to ignore any existing cache data on disk. This will cause a full re-lint of all linted files.",
		);
		console.log("");
		console.log("  --fix");
		console.log("    Enables auto-fixing 'fixes' from rule reports.");
		console.log("");
		console.log("  --fix-suggestions <suggestion>");
		console.log(
			"    Enables auto-fixing any number of specific 'suggestions' from rule reports.",
		);
		console.log("");
		console.log("  --interactive");
		console.log(
			"    Whether to run Flint with an interactive 'one file at a time' viewer.",
		);
		console.log("");
		console.log("  --presenter <brief|detailed>");
		console.log(
			"    Which 'presenter' to output results using: brief (default) or detailed.",
		);
		console.log("");
		console.log("  --skip-diagnostics");
		console.log(
			"    Whether to skip reporting language 'diagnostics' after linting.",
		);
		console.log("");
		console.log("  --version");
		console.log("    Prints the current package version of Flint.");
		console.log("");
		console.log("  --watch");
		console.log(
			"    Whether to keep the linting process running, re-linting files as they change.",
		);
		console.log("");
		console.log(
			"See \u001b]8;;flint.fyi\u0007flint.fyi\u001b]8;;\u0007 for more information.",
		);
		return 0;
	}

	if (values.version) {
		console.log(packageData.version);
		return 0;
	}

	const configFileName = await findConfigFileName(process.cwd());
	if (!configFileName) {
		console.error("No flint.config.* file found.");
		console.error(
			"The Flint CLI auto-initializer is not yet implemented. Check back soon!",
		);
		console.error(
			`In the meantime, why not join \u001b]8;;https://flint.fyi/discord\u0007flint.fyi/discord\u001b]8;;\u0007 and chat with us? ❤️`,
		);
		return 2;
	}

	const getRenderer = createRendererFactory(configFileName, values);

	if (values.watch) {
		await runCliWatch(configFileName, getRenderer, values);
		console.log("👋 Thanks for using Flint!");
		return 0;
	}

	const renderer = getRenderer();
	const exitCode = await runCliOnce(configFileName, renderer, values);

	renderer.dispose?.();

	return exitCode;
}
