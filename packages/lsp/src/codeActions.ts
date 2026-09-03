import type { TextDocument } from "vscode-languageserver-textdocument";
import {
	CodeActionKind,
	TextEdit,
	type CodeAction,
	type CodeActionContext,
	type Diagnostic,
} from "vscode-languageserver/node.js";

import type { FileChange, FileReport, Suggestion } from "@flint.fyi/core";

import { FLINT_DIAGNOSTIC_SOURCE } from "./diagnostics.ts";
import { filePathToUri } from "./filePathToUri.ts";

export interface CodeActionOptions {
	getDocument(uri: string): TextDocument | undefined;
	workspaceRoot: string;
}

export function createCodeActions(
	uri: string,
	context: CodeActionContext,
	reports: FileReport[],
	document: TextDocument,
	options?: CodeActionOptions,
): CodeAction[] {
	const reportsByKey = new Map(
		reports.map((report) => [
			diagnosticKey(
				report.about.id,
				report.range.begin.line,
				report.range.begin.column,
				report.range.end.line,
				report.range.end.column,
			),
			report,
		]),
	);

	const actions: CodeAction[] = [];

	for (const diagnostic of context.diagnostics) {
		if (diagnostic.source !== FLINT_DIAGNOSTIC_SOURCE) {
			continue;
		}

		const report = reportsByKey.get(
			diagnosticKey(
				diagnostic.code,
				diagnostic.range.start.line,
				diagnostic.range.start.character,
				diagnostic.range.end.line,
				diagnostic.range.end.character,
			),
		);
		if (!report) {
			continue;
		}

		if (report.fix) {
			actions.push(createFixAction(uri, diagnostic, report.fix, document));
		}

		if (report.suggestions) {
			for (const suggestion of report.suggestions) {
				const action = createSuggestionAction(
					uri,
					diagnostic,
					suggestion,
					document,
					options,
				);
				if (action) {
					actions.push(action);
				}
			}
		}
	}

	return actions;
}

function createFilesSuggestionAction(
	diagnostic: Diagnostic,
	suggestion: Extract<Suggestion, { files: object }>,
	options: CodeActionOptions | undefined,
) {
	if (!options) {
		return undefined;
	}

	const changes: Record<string, TextEdit[]> = {};

	for (const [filePath, fileChanges] of Object.entries(suggestion.files)) {
		if (!fileChanges?.length) {
			continue;
		}

		const targetUri = filePathToUri(filePath, options.workspaceRoot);
		const targetDocument = options.getDocument(targetUri);
		if (!targetDocument) {
			return undefined;
		}

		changes[targetUri] = fileChanges.map((fileChange) =>
			fileChangeToTextEdit(fileChange, targetDocument),
		);
	}

	if (!Object.keys(changes).length) {
		return undefined;
	}

	return {
		diagnostics: [diagnostic],
		edit: { changes },
		kind: CodeActionKind.QuickFix,
		title: `Suggestion: ${suggestion.id}`,
	};
}

function createFixAction(
	uri: string,
	diagnostic: Diagnostic,
	fixes: FileChange[],
	document: TextDocument,
) {
	return {
		diagnostics: [diagnostic],
		edit: {
			changes: {
				[uri]: fixes.map((fix) => fileChangeToTextEdit(fix, document)),
			},
		},
		isPreferred: true,
		kind: CodeActionKind.QuickFix,
		title: `Fix: ${diagnostic.message}`,
	};
}

function createSuggestionAction(
	uri: string,
	diagnostic: Diagnostic,
	suggestion: Suggestion,
	document: TextDocument,
	options: CodeActionOptions | undefined,
) {
	if ("files" in suggestion) {
		return createFilesSuggestionAction(diagnostic, suggestion, options);
	}

	return {
		diagnostics: [diagnostic],
		edit: {
			changes: {
				[uri]: [fileChangeToTextEdit(suggestion, document)],
			},
		},
		kind: CodeActionKind.QuickFix,
		title: `Suggestion: ${suggestion.id}`,
	};
}

function diagnosticKey(
	id: number | string | undefined,
	beginLine: number,
	beginColumn: number,
	endLine: number,
	endColumn: number,
) {
	return [id, beginLine, beginColumn, endLine, endColumn].join("|");
}

function fileChangeToTextEdit(change: FileChange, document: TextDocument) {
	return TextEdit.replace(
		{
			end: document.positionAt(change.range.end),
			start: document.positionAt(change.range.begin),
		},
		change.text,
	);
}
