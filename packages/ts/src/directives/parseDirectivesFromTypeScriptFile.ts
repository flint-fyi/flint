import {
	DirectivesCollector,
	type NormalizedReportRangeObject,
} from "@flint.fyi/core";
import { nullThrows } from "@flint.fyi/utils";
import * as tsutils from "ts-api-utils";
import type ts from "typescript";

import { normalizeRange } from "../normalizeRange.ts";

export interface ExtractedDirective {
	range: NormalizedReportRangeObject;
	selection: string;
	type: string;
}

export function extractDirectivesFromTypeScriptFile(sourceFile: ts.SourceFile) {
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

		const range = normalizeRange(commentRange, sourceFile);
		const matches = match.slice(1);
		const type = nullThrows(
			matches[0],
			"First match is expected to be present by the regex match",
		);
		const selection = matches[1] ?? "";

		directives.push({ range, selection, type });
	});

	return directives;
}

export function parseDirectivesFromTypeScriptFile(sourceFile: ts.SourceFile) {
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
