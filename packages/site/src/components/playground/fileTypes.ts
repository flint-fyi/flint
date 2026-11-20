import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import type { LanguageSupport } from "@codemirror/language";
import {
	getFileExtension,
	getPlaygroundParser,
} from "~/playground/getPlaygroundParser.ts";
import type { PlaygroundParser } from "~/playground/types.ts";

import type { PlaygroundIcons } from "./PlaygroundIcons.ts";

export interface PlaygroundFileType {
	editorSupport: () => LanguageSupport;
	icon: keyof Pick<
		PlaygroundIcons,
		"javaScriptIcon" | "jsonIcon" | "typeScriptIcon"
	>;
	name: string;
}

/**
 * Names of the parsers that create language reports, such as type errors.
 */
export const playgroundParserNames: Record<PlaygroundParser, string> = {
	json: "JSON",
	typescript: "TypeScript",
};

export function getPlaygroundFileType(
	fileName: string,
): PlaygroundFileType | undefined {
	const parser = getPlaygroundParser(fileName);

	if (parser === "json") {
		return { editorSupport: json, icon: "jsonIcon", name: "JSON" };
	}

	if (!parser) {
		return undefined;
	}

	const extension = getFileExtension(fileName) ?? "";
	const isJavaScript = extension.includes("j");
	const isJsx = extension.endsWith("x");

	return {
		editorSupport: () => javascript({ jsx: isJsx, typescript: !isJavaScript }),
		icon: isJavaScript ? "javaScriptIcon" : "typeScriptIcon",
		name: `${isJavaScript ? "JavaScript" : "TypeScript"}${isJsx ? " (JSX)" : ""}`,
	};
}
