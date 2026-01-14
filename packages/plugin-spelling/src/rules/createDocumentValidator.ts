import { toFileDirURL, toFileURL } from "@cspell/url";
import {
	checkFilenameMatchesGlob,
	createTextDocument,
	type CSpellSettings,
	DocumentValidator,
} from "cspell-lib";
import path from "node:path";
import { pathToFileURL } from "node:url";

export async function createDocumentValidator(fileName: string, text: string) {
	const cwd = process.cwd();
	const document = createTextDocument({
		content: text,
		uri: fileName,
	});

	const resolveImportsRelativeTo = toFileURL(
		import.meta.url,
		toFileDirURL(cwd),
	);

	// It would be nice to use the DocumentValidator's `import` setting.
	// However, even with unique timestamps, cspell seemed to cache the import.
	// See: https://github.com/flint-fyi/flint/issues/203
	const configFilePath = path.join(cwd, "cspell.json");
	const configFileUrlBase = pathToFileURL(configFilePath).href;
	const configFileUrl = `${configFileUrlBase}?timestamp=${performance.now()}`;

	let config: CSpellSettings = {};
	try {
		config = (
			(await import(configFileUrl, {
				// eslint-disable-next-line jsdoc/no-bad-blocks
				/* @vite-ignore */
				with: { type: "json" },
			})) as { default: CSpellSettings }
		).default;
	} catch {
		// fail silently (add debug logging later)
	}

	const validator = new DocumentValidator(
		document,
		{ resolveImportsRelativeTo },
		config,
	);

	await validator.prepare();

	const finalSettings = validator.getFinalizedDocSettings();

	if (
		finalSettings.ignorePaths &&
		checkFilenameMatchesGlob(fileName, finalSettings.ignorePaths)
	) {
		return undefined;
	}

	return validator;
}
