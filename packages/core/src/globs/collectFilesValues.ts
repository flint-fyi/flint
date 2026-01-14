import type { FilesValue } from "../types/files.ts";
import { flatten } from "../utils/arrays.ts";

export function collectFilesValues(
	filesValues: FilesValue[],
	exclude: Set<string>,
	include: Set<string>,
) {
	for (const files of filesValues) {
		switch (typeof files) {
			case "function":
				break;

			case "string":
				include.add(files);
				break;

			default:
				for (const excluded of flatten(files.exclude)) {
					if (typeof excluded === "string") {
						exclude.add(excluded);
					}
				}
				for (const included of flatten(files.include)) {
					if (typeof included === "string") {
						include.add(included);
					}
				}
				break;
		}
	}
}
