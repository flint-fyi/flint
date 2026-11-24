import path from "node:path";

import type { TextDocument } from "vscode-languageserver-textdocument";
import {
	CodeActionKind,
	TextEdit,
	type CodeAction,
	type CodeActionContext,
	type Diagnostic,
	type Range,
} from "vscode-languageserver/node.js";

import {
	isSuggestionForFiles,
	type FileChange,
	type FileReport,
} from "@flint.fyi/core";
import { normalizePath } from "@flint.fyi/utils";

import { createReportRange, FLINT_DIAGNOSTIC_SOURCE } from "./diagnostics.ts";
import { filePathToUri } from "./filePathToUri.ts";

export interface CodeActionOptions {
	getDocument(filePath: string): TextDocument | undefined;
	workspaceRoot: string;
}

export function createCodeActions(
	filePath: string,
	context: CodeActionContext,
	reports: FileReport[],
	options: CodeActionOptions,
): CodeAction[] {
	const reportsByKey = new Map(
		reports.map((report) => [
			diagnosticKey(report.about.id, createReportRange(report)),
			report,
		]),
	);

	return context.diagnostics.flatMap((diagnostic) => {
		if (diagnostic.source !== FLINT_DIAGNOSTIC_SOURCE) {
			return [];
		}

		const report = reportsByKey.get(
			diagnosticKey(diagnostic.code, diagnostic.range),
		);
		if (!report) {
			return [];
		}

		return [
			report.fix &&
				createAction(
					diagnostic,
					`Fix: ${diagnostic.message}`,
					[[filePath, report.fix]],
					options,
					true,
				),
			...(report.suggestions ?? []).map((suggestion) =>
				createAction(
					diagnostic,
					`Suggestion: ${suggestion.id}`,
					isSuggestionForFiles(suggestion)
						? Object.entries(suggestion.files).map(
								([suggestionFilePath, fileChanges]) => [
									normalizePath(
										path.resolve(options.workspaceRoot, suggestionFilePath),
									),
									fileChanges,
								],
							)
						: [[filePath, [suggestion]]],
					options,
				),
			),
		].filter((action) => action !== undefined);
	});
}

function createAction(
	diagnostic: Diagnostic,
	title: string,
	fileChangesByFilePath: [string, FileChange[] | undefined][],
	options: CodeActionOptions,
	isPreferred?: true,
): CodeAction | undefined {
	const changes: Record<string, TextEdit[]> = {};

	for (const [filePath, fileChanges] of fileChangesByFilePath) {
		if (!fileChanges?.length) {
			continue;
		}

		const document = options.getDocument(filePath);
		if (!document) {
			return undefined;
		}

		changes[filePathToUri(filePath)] = fileChanges.map((fileChange) =>
			TextEdit.replace(
				{
					end: document.positionAt(fileChange.range.end),
					start: document.positionAt(fileChange.range.begin),
				},
				fileChange.text,
			),
		);
	}

	if (!Object.keys(changes).length) {
		return undefined;
	}

	return {
		diagnostics: [diagnostic],
		edit: { changes },
		...(isPreferred && { isPreferred }),
		kind: CodeActionKind.QuickFix,
		title,
	};
}

function diagnosticKey(
	code: number | string | undefined,
	{ end, start }: Range,
) {
	return [code, start.line, start.character, end.line, end.character].join("|");
}
