import type { LanguageReport } from "@flint.fyi/core";

// flint-disable-next-line ts/regexControlCharacters
// eslint-disable-next-line no-control-regex
const ansiEscapePattern = /\x1b\[\d+m/g;

/**
 * Language reports' text is formatted for terminals, as:
 * `[file:line:column - ]CODE: message[\n\ncode frame and related information]`
 */
export function getLanguageReportMessage(report: LanguageReport): string {
	const text = report.text.replaceAll(ansiEscapePattern, "");
	const codePrefix = report.code === undefined ? undefined : `${report.code}: `;
	const codeIndex = codePrefix === undefined ? -1 : text.indexOf(codePrefix);
	const message =
		codePrefix === undefined || codeIndex === -1
			? text
			: text.slice(codeIndex + codePrefix.length);

	return message.split("\n\n", 1)[0] ?? message;
}
