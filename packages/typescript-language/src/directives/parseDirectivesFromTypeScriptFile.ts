import { SyntaxKind } from "typescript-native/unstable/ast";

import {
	DirectivesCollector,
	type DirectiveCollection,
	type NormalizedReportRangeObject,
} from "@flint.fyi/core";
import { nullThrows } from "@flint.fyi/utils";

import { normalizeRange } from "../normalizeRange.ts";
import type * as AST from "../types/ast.ts";
import { collectComments } from "../utils/collectComments.ts";
import { createScanner } from "../utils/createScanner.ts";

export interface ExtractedDirective {
	range: NormalizedReportRangeObject;
	selection: string;
	type: string;
}

export function extractDirectivesFromTypeScriptFile(
	sourceFile: AST.SourceFile,
): ExtractedDirective[] {
	const directives: ExtractedDirective[] = [];

	for (const comment of collectComments(sourceFile)) {
		const match = /^\/\/\s*flint-(\S+)(?:\s+(.+))?/.exec(comment.text);
		if (!match) {
			continue;
		}

		const commentRange = {
			begin: comment.pos,
			end: comment.end,
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
	}

	return directives;
}

export function parseDirectivesFromTypeScriptFile(
	sourceFile: AST.SourceFile,
): DirectiveCollection {
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
	const scanner = createScanner(
		true,
		sourceFile.languageVariant,
		sourceFile.text,
		nextLineStart,
	);

	const kind = scanner.scan();

	// Reaching the end of the file means there are no more lines
	if (kind === SyntaxKind.EndOfFile) {
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
