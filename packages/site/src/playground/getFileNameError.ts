import {
	getFileExtension,
	getPlaygroundLanguage,
} from "./getPlaygroundLanguage.ts";

const fileNamePattern = /^[\w.-]+$/;
const reservedFileNames: ReadonlySet<string> = new Set([
	"jsx.d.ts",
	"tsconfig.json",
]);

/**
 * Describes why a file name can't be used, if it can't.
 * While typing, errors that more typing might resolve are skipped.
 */
export function getFileNameError(
	fileName: string,
	otherFileNames: readonly string[],
	isTyping = false,
): string | undefined {
	if (!fileName) {
		return isTyping ? undefined : "Enter a file name.";
	}

	if (!fileNamePattern.test(fileName)) {
		return "Use only letters, numbers, dots, dashes, and underscores.";
	}

	if (!getPlaygroundLanguage(fileName)) {
		return getExtensionError(fileName, isTyping);
	}

	if (reservedFileNames.has(fileName)) {
		return `${fileName} is reserved by the playground.`;
	}

	if (otherFileNames.includes(fileName)) {
		return "A file with this name already exists.";
	}

	return undefined;
}

function getExtensionError(
	fileName: string,
	isTyping: boolean,
): string | undefined {
	if (isTyping) {
		return undefined;
	}

	const extension = getFileExtension(fileName);

	return extension && extension !== "."
		? `${extension} files aren't supported yet.`
		: "Add a file extension.";
}
