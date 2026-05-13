import { toFileDirURL, toFileURL } from "@cspell/url";
import {
	checkFilenameMatchesGlob,
	createTextDocument,
	type CSpellSettings,
	DocumentValidator,
} from "cspell-lib";

export async function createDocumentValidator(
	cwd: string,
	fileName: string,
	text: string,
	config: CSpellSettings,
) {
	const document = createTextDocument({
		content: text,
		uri: fileName,
	});

	const resolveImportsRelativeTo = toFileURL(
		import.meta.url,
		toFileDirURL(cwd),
	);

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
