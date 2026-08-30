import type { Diagnostic } from "typescript-native/unstable/sync";

import type { LanguageReport } from "@flint.fyi/core";

export type TSDiagnostic = Diagnostic;

export function convertTypeScriptDiagnosticToLanguageReport(
	diagnostic: Diagnostic,
): LanguageReport {
	return {
		code: `TS${diagnostic.code}`,
		...(diagnostic.fileName !== undefined && {
			range: { begin: diagnostic.pos, end: diagnostic.end },
		}),
		source: "typescript",
		text: formatReport(diagnostic),
	};
}

function color(text: string, formatStyle: string): string {
	return formatStyle + text + resetEscapeSequence;
}

function flattenMessage(diagnostic: Diagnostic, depth = 0): string {
	let output =
		depth === 0 ? diagnostic.text : `\n${"  ".repeat(depth)}${diagnostic.text}`;
	for (const child of diagnostic.messageChain ?? []) {
		output += flattenMessage(child, depth + 1);
	}
	return output;
}

function formatReport(diagnostic: Diagnostic): string {
	let output = "";

	if (diagnostic.fileName !== undefined && diagnostic.startPosition) {
		output += formatLocation(diagnostic.fileName, diagnostic.startPosition);
		output += " - ";
	}
	output += color(`TS${diagnostic.code}`, COLOR.Grey);
	output += ": ";
	output += flattenMessage(diagnostic);
	if (
		diagnostic.fileName !== undefined &&
		diagnostic.startPosition &&
		diagnostic.endPosition &&
		diagnostic.sourceLines
	) {
		output += formatCodeSpan(
			diagnostic.startPosition,
			diagnostic.endPosition,
			diagnostic.sourceLines,
			"",
			COLOR.Red,
		);
	}
	for (const related of diagnostic.relatedInformation ?? []) {
		output += "\n";
		const indent = "  ";
		if (related.fileName !== undefined && related.startPosition) {
			output += `\n ${formatLocation(related.fileName, related.startPosition)}`;
			if (related.endPosition && related.sourceLines) {
				output += formatCodeSpan(
					related.startPosition,
					related.endPosition,
					related.sourceLines,
					indent,
					COLOR.Cyan,
				);
			}
		}
		output += `\n${indent}${flattenMessage(related)}`;
	}

	return output;
}

const gutterStyleSequence = "\u001B[7m";
const ellipsis = "...";
const gutterSeparator = " ";
const resetEscapeSequence = "\u001B[0m";
const COLOR = {
	Cyan: "\u001B[96m",
	Grey: "\u001B[90m",
	Red: "\u001B[91m",
	Yellow: "\u001B[93m",
};

function displayFilename(name: string): string {
	if (name.startsWith("./")) {
		return name.slice(2);
	}
	return name.slice(process.cwd().length + 1);
}

function formatCodeSpan(
	startPosition: { character: number; line: number },
	endPosition: { character: number; line: number },
	sourceLines: readonly { line: number; text: string }[],
	indent: string,
	squiggleColor: string,
): string {
	const hasMoreThanFiveLines = endPosition.line - startPosition.line >= 4;
	const gutterWidth = hasMoreThanFiveLines
		? Math.max(ellipsis.length, `${endPosition.line + 1}`.length)
		: `${endPosition.line + 1}`.length;
	let context = "";
	let previousLine: number | undefined;

	for (const { line, text } of sourceLines) {
		if (previousLine !== undefined && line > previousLine + 1) {
			context += `\n${indent}${color(
				ellipsis.padStart(gutterWidth),
				gutterStyleSequence,
			)}${gutterSeparator}`;
		}
		const lineContent = text.replace(/\t/g, " ").trimEnd();
		context += "\n";
		context +=
			indent +
			color(`${line + 1}`.padStart(gutterWidth), gutterStyleSequence) +
			gutterSeparator +
			lineContent +
			"\n";
		context +=
			indent +
			color("".padStart(gutterWidth), gutterStyleSequence) +
			gutterSeparator +
			squiggleColor;
		const firstCharacter =
			line === startPosition.line ? startPosition.character : 0;
		const lastCharacter =
			line === endPosition.line ? endPosition.character : lineContent.length;
		context += " ".repeat(firstCharacter);
		context += "~".repeat(
			Math.max(0, Math.min(lastCharacter, lineContent.length) - firstCharacter),
		);
		context += resetEscapeSequence;
		previousLine = line;
	}

	return context;
}

function formatLocation(
	fileName: string,
	position: { character: number; line: number },
): string {
	return `${color(displayFilename(fileName), COLOR.Cyan)}:${color(
		`${position.line + 1}`,
		COLOR.Yellow,
	)}:${color(`${position.character + 1}`, COLOR.Yellow)}`;
}
