import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import type { LanguageSupport } from "@codemirror/language";
import {
	getFileExtension,
	getPlaygroundLanguage,
} from "~/playground/getPlaygroundLanguage.ts";
import type { PlaygroundLanguage } from "~/playground/types.ts";

export interface PlaygroundFileType {
	badge: "JS" | "TS" | "{}";
	editorSupport: () => LanguageSupport;
	name: string;
}

/**
 * Names of the parsers that create language reports, such as type errors.
 */
export const playgroundLanguageNames: Record<PlaygroundLanguage, string> = {
	json: "JSON",
	typescript: "TypeScript",
};

export function getPlaygroundFileType(
	fileName: string,
): PlaygroundFileType | undefined {
	const language = getPlaygroundLanguage(fileName);

	if (language === "json") {
		return { badge: "{}", editorSupport: json, name: "JSON" };
	}

	if (!language) {
		return undefined;
	}

	const extension = getFileExtension(fileName) ?? "";
	const isJavaScript = extension.includes("j");
	const isJsx = extension.endsWith("x");

	return {
		badge: isJavaScript ? "JS" : "TS",
		editorSupport: () => javascript({ jsx: isJsx, typescript: !isJavaScript }),
		name: `${isJavaScript ? "JavaScript" : "TypeScript"}${isJsx ? " (JSX)" : ""}`,
	};
}
