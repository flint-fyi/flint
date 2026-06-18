import * as path from "node:path";

import { formatReport, type FileReport } from "@flint.fyi/core";

import type { PresenterFactory, PresenterVirtualFile } from "./types.ts";

export const githubPresenterFactory: PresenterFactory = {
	about: {
		name: "github",
	},
	initialize() {
		return {
			*renderFile({ file, reports }) {
				for (const report of reports) {
					yield formatAnnotation(file, report);
					yield "\n";
				}
			},
		};
	},
};

function escapeData(value: string) {
	return value
		.replaceAll("%", "%25")
		.replaceAll("\r", "%0D")
		.replaceAll("\n", "%0A");
}

function escapeProperty(value: string) {
	return escapeData(value).replaceAll(",", "%2C").replaceAll(":", "%3A");
}

function formatAnnotation(file: PresenterVirtualFile, report: FileReport) {
	const { begin, end } = report.range;
	const ruleId = report.about.id;
	const message = formatReport(report.data, report.message.primary);

	const properties = [
		`file=${escapeProperty(relativeFilePath(file.filePath))}`,
		`line=${begin.line + 1}`,
	];

	if (begin.line === end.line) {
		properties.push(`col=${begin.column + 1}`, `endColumn=${end.column + 1}`);
	}

	properties.push(`endLine=${end.line + 1}`, `title=${escapeProperty(ruleId)}`);

	return `::error ${properties.join(",")}::${escapeData(`${ruleId}: ${message}`)}`;
}

function relativeFilePath(filePath: string) {
	const relative = path.isAbsolute(filePath)
		? path.relative(process.cwd(), filePath)
		: filePath;

	return relative.split(path.sep).join("/");
}
