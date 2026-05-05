import {
	DirectivesCollector,
	type NormalizedReportRangeObject,
} from "@flint.fyi/core";
import { nullThrows } from "@flint.fyi/utils";
import * as tsutils from "ts-api-utils";
import ts from "typescript";

import { normalizeRange } from "../normalizeRange.ts";
import type * as AST from "../types/ast.ts";

export interface ExtractedDirective {
	range: NormalizedReportRangeObject;
	selection: string;
	type: string;
}

export function extractDirectivesFromTypeScriptFile(
	sourceFile: AST.SourceFile,
) {
	const directives: ExtractedDirective[] = [];

	tsutils.forEachComment(sourceFile, (fullText, sourceRange) => {
		const commentText = fullText.slice(sourceRange.pos, sourceRange.end);
		const match = /^\/\/\s*flint-(\S+)(?:\s+(.+))?/.exec(commentText);
		if (!match) {
			return;
		}

		const commentRange = {
			begin: sourceRange.pos,
			end: sourceRange.end,
		};

		let range = normalizeRange(commentRange, sourceFile);
		const matches = match.slice(1);
		const type = nullThrows(
			matches[0],
			"First match is expected to be present by the regex match",
		);
		const selection = matches[1] ?? "";

		if (type === "disable-next-line") {
			range = extendRangeToNextCodeLine(sourceFile, range);
		}

		directives.push({ range, selection, type });
	});

	return directives;
}

export function parseDirectivesFromTypeScriptFile(sourceFile: AST.SourceFile) {
	const collector = new DirectivesCollector(
		sourceFile.statements.at(0)?.getStart(sourceFile) ?? sourceFile.text.length,
	);

	for (const { range, selection, type } of extractDirectivesFromTypeScriptFile(
		sourceFile,
	)) {
		collector.add(range, selection, type);
	}

	return collector.collect();
}

function computeNextCodeLine(
	sourceFile: AST.SourceFile,
	directiveLine: number,
) {
	const lineStarts = sourceFile.getLineStarts();
	const nextLineStart = lineStarts[directiveLine + 1];

	if (nextLineStart === undefined) {
		return undefined;
	}

	// Skip comments and whitespace to find the first token on the next line
	const scanner = ts.createScanner(
		sourceFile.languageVersion,
		true,
		sourceFile.languageVariant,
		sourceFile.text,
		undefined,
		nextLineStart,
	);

	const kind = scanner.scan();

	// Reaching the end of the file means there are no more lines
	if (kind === ts.SyntaxKind.EndOfFileToken) {
		return undefined;
	}

	const tokenPos = scanner.getTokenStart();
	const codeLine = sourceFile.getLineAndCharacterOfPosition(tokenPos).line;

	for (let line = directiveLine + 1; line < codeLine; line++) {
		const start = lineStarts[line];
		const end = lineStarts[line + 1] ?? sourceFile.text.length;

		// If there is an empty line between the directive and the target line,
		// the directive should keep its default next-line behavior.
		if (sourceFile.text.slice(start, end).trim() === "") {
			return undefined;
		}
	}

	return codeLine;
}

function extendRangeToNextCodeLine(
	sourceFile: AST.SourceFile,
	range: NormalizedReportRangeObject,
) {
	const codeLine = computeNextCodeLine(sourceFile, range.begin.line);

	if (codeLine === undefined || codeLine <= range.end.line + 1) {
		return range;
	}

	const lineStarts = sourceFile.getLineStarts();
	const endPosition =
		nullThrows(
			lineStarts[codeLine],
			"Code line start is expected to be present by the computed code line",
		) - 1;
	const { character, line } =
		sourceFile.getLineAndCharacterOfPosition(endPosition);

	return {
		...range,
		end: {
			column: character,
			line,
			raw: endPosition,
		},
	};
}
