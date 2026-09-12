import path from "node:path";
import { pathToFileURL } from "node:url";

import {
	isConfig,
	validateConfigDefinition,
	type LinterHost,
	type ProcessedConfigDefinition,
} from "@flint.fyi/core";

export async function loadConfigDefinition(
	host: LinterHost,
	configFileName: string,
	importVersion?: number,
): Promise<ProcessedConfigDefinition | undefined> {
	const configUrl = pathToFileURL(
		path.join(host.getCurrentDirectory(), configFileName),
	);
	if (importVersion != null) {
		configUrl.searchParams.set("version", importVersion.toString());
	}

	const { default: config } = (await import(configUrl.href)) as {
		default: unknown;
	};

	if (!isConfig(config)) {
		console.error(
			`${configFileName} does not default export a Flint defineConfig value.`,
		);
		return;
	}

	const validationError = validateConfigDefinition(
		config.definition,
		configFileName,
	);

	if (validationError) {
		console.error(validationError);
		return;
	}

	return {
		...config.definition,
		filePath: configFileName,
	};
}
