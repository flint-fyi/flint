import { stripVTControlCharacters } from "node:util";

import type { TextDocument } from "vscode-languageserver-textdocument";
import {
	Diagnostic,
	DiagnosticSeverity,
	Range,
} from "vscode-languageserver/node.js";

import {
	formatReport,
	type FileReport,
	type FileResults,
	type LanguageReport,
	type ReportInterpolationData,
	type ReportMessageData,
} from "@flint.fyi/core";

export const FLINT_DIAGNOSTIC_SOURCE = "flint";
const LANGUAGE_DIAGNOSTIC_SOURCE = "flint/language";

export function mapFileResultsToDiagnostics(
	fileResults: FileResults,
	document: TextDocument | undefined,
): Diagnostic[] {
	return [
		...fileResults.reports.map(mapReportToDiagnostic),
		...fileResults.languageReports.map((report) =>
			mapLanguageReport(report, document),
		),
	];
}

function formatMessage(
	message: ReportMessageData,
	data: ReportInterpolationData | undefined,
): string {
	return [message.primary, ...message.secondary]
		.map((part) => formatReport(data, part))
		.join(" ");
}

function mapLanguageReport(
	report: LanguageReport,
	document: TextDocument | undefined,
): Diagnostic {
	const range =
		report.range && document
			? Range.create(
					document.positionAt(report.range.begin),
					document.positionAt(report.range.end),
				)
			: Range.create(0, 0, 0, 0);

	return {
		...(report.code !== undefined && { code: report.code }),
		message: stripVTControlCharacters(report.text),
		range,
		severity: DiagnosticSeverity.Error,
		source: report.source ?? LANGUAGE_DIAGNOSTIC_SOURCE,
	};
}

function mapReportToDiagnostic(report: FileReport): Diagnostic {
	return {
		...(report.about.url && {
			codeDescription: { href: report.about.url },
		}),
		code: report.about.id,
		message: formatMessage(report.message, report.data),
		range: Range.create(
			report.range.begin.line,
			report.range.begin.column,
			report.range.end.line,
			report.range.end.column,
		),
		severity: DiagnosticSeverity.Warning,
		source: FLINT_DIAGNOSTIC_SOURCE,
	};
}
