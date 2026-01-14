import type { BaseAbout } from "./about.ts";
import type { Fix, Suggestion } from "./changes.ts";
import type { CharacterReportRange, ColumnAndLine } from "./ranges.ts";

export interface FileReport extends NormalizedReport {
	/**
	 * Metadata on the rule or other system that created this report.
	 */
	about: BaseAbout;
}

export interface FileReportWithFix extends FileReport {
	fix: Fix[];
}

export interface NormalizedReportRangeObject {
	begin: ColumnAndLine;
	end: ColumnAndLine;
}

/**
 * A full rule report that can be used to display to users via a reporter.
 */
export interface NormalizedReport {
	data?: ReportInterpolationData | undefined;

	/**
	 * Any files that should be factored into caching this report.
	 */
	dependencies?: string[];

	fix?: Fix[] | undefined;
	message: ReportMessageData;
	range: NormalizedReportRangeObject;
	suggestions?: Suggestion[] | undefined;
}

export type ReportInterpolationData = Record<string, boolean | number | string>;

/**
 * The internal raw rule report format used by rules themselves.
 */
export interface RuleReport<Message extends string = string> {
	data?: ReportInterpolationData | undefined;

	/**
	 * Any files that should be factored into caching this report.
	 */
	dependencies?: string[];

	/**
	 * Relative file path to the file to place the report in.
	 * If omitted:
	 * - If in a rule visitor: defaults to the current file being visited
	 * - In a setup() or teardown() method: throws an error
	 */
	filePath?: string;

	fix?: Fix | Fix[] | undefined;
	message: Message;
	suggestions?: Suggestion[] | undefined;

	/**
	 * Which specific characters in the source file are affected by this report.
	 */
	range: CharacterReportRange;
}

/**
 * Full data for a report message to be displayed to users.
 */
export interface ReportMessageData {
	/**
	 * A single sentence explaining what's wrong.
	 */
	primary: string;

	/**
	 * Additional sentences explaining the problem in more detail.
	 */
	secondary: string[];

	/**
	 * Recommendations for how to fix the problem.
	 */
	suggestions: string[];
}
