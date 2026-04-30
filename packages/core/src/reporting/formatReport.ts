import type { ReportInterpolationData } from "../types/reports.ts";

/**
 * Interpolates any report data into its content.
 */
export function formatReport(
	data: ReportInterpolationData | undefined,
	content: string,
) {
	if (!data) {
		return content;
	}

	return content.replaceAll(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) => {
		if (key in data) {
			return String(data[key]);
		}

		return match;
	});
}
