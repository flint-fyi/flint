import { describe, expect, it } from "vitest";

import type { CommentDirective } from "../../types/directives.ts";
import type { NormalizedReportRangeObject } from "../../types/reports.ts";
import { directiveReports } from "./directiveReports.ts";

const stubRange: NormalizedReportRangeObject = {
	begin: { column: 0, line: 0, raw: 0 },
	end: { column: 10, line: 0, raw: 10 },
};

const stubDirective: CommentDirective = {
	range: stubRange,
	selections: ["ts/noExplicitAny"],
	type: "disable-next-line",
};

describe("directiveReports", () => {
	it("creates already disabled report with descriptive secondary and suggestions", () => {
		const report = directiveReports.createAlreadyDisabled(
			stubDirective,
			"ts/noExplicitAny",
		);

		expect(report).toEqual({
			about: {
				id: "commentDirectiveAlreadyDisabled",
			},
			message: {
				primary:
					'The selection "ts/noExplicitAny" is already disabled by a previous flint-disable-next-line comment directive.',
				secondary: [
					"Disabling a rule multiple times in the same scope is redundant.",
					"Redundant directives add noise and can make it harder to tell which directive is active.",
				],
				suggestions: [
					"Remove this redundant directive.",
					"If the earlier directive was unintentional, remove or adjust that directive instead.",
				],
			},
			range: stubRange,
		});
	});

	it("creates file after content report with descriptive secondary and suggestions", () => {
		const report = directiveReports.createFileAfterContent(stubRange);

		expect(report).toEqual({
			about: {
				id: "commentDirectiveFileAfterContent",
			},
			message: {
				primary:
					'A "flint-disable-file" comment directive must come before any non-comment contents.',
				secondary: [
					"File-level disable directives apply to the entire file and are meant to be placed at the top.",
					"Placing them after code can be confusing because it looks like a regional disable rather than a file-wide one.",
				],
				suggestions: [
					'Move the "flint-disable-file" directive to the top of the file, before any statements.',
					'If you only intended to disable rules for part of the file, use "flint-disable-next-line" or "flint-disable-lines-begin" instead.',
				],
			},
			range: stubRange,
		});
	});

	it("creates no selection report with descriptive secondary and suggestions", () => {
		const report = directiveReports.createNoSelection(
			"disable-next-line",
			stubRange,
		);

		expect(report).toEqual({
			about: {
				id: "commentDirectiveNoSelection",
			},
			message: {
				primary:
					'Comment directive "disable-next-line" needs to select rule(s).',
				secondary: [
					"Comment directives require at least one rule name or wildcard pattern.",
					"Without any specified rules, the directive cannot determine what to disable and has no effect.",
				],
				suggestions: [
					'Specify one or more rule names or patterns after the directive type, such as "flint-disable-next-line rule-name".',
					"If the directive is no longer needed, remove it.",
				],
			},
			range: stubRange,
		});
	});

	it("creates not previously disabled report with descriptive secondary and suggestions", () => {
		const report = directiveReports.createNotPreviouslyDisabled(
			stubRange,
			"ts/noExplicitAny",
		);

		expect(report).toEqual({
			about: {
				id: "commentDirectiveNotPreviouslyDisabled",
			},
			message: {
				primary:
					'The selection "ts/noExplicitAny" was not disabled in a previous comment directive.',
				secondary: [
					'A "disable-lines-end" directive should only close rule selections previously opened by a "disable-lines-begin" directive.',
					"Closing a selection that was never opened has no effect and usually indicates a mismatched rule name or missing begin directive.",
				],
				suggestions: [
					'Verify that the rule name matches the one used in the preceding "flint-disable-lines-begin" directive.',
					'Add a preceding "flint-disable-lines-begin" directive if one is missing.',
					"If the directive is no longer needed, remove it.",
				],
			},
			range: stubRange,
		});
	});

	it("creates unknown report with descriptive secondary and suggestions", () => {
		const report = directiveReports.createUnknown("invalid", stubRange);

		expect(report).toEqual({
			about: {
				id: "commentDirectiveUnknown",
			},
			message: {
				primary: 'Unknown comment directive type: "invalid".',
				secondary: [
					'Flint supports "disable-file", "disable-lines-begin", "disable-lines-end", and "disable-next-line" directive types.',
					"Unrecognized directive types are ignored and will not suppress any linting reports.",
				],
				suggestions: [
					'Change the directive to one of the supported types (for example, "flint-disable-next-line").',
					'If this comment is not intended as a Flint directive, change the comment so it does not begin with "flint-".',
				],
			},
			range: stubRange,
		});
	});

	it("creates unused report with descriptive secondary and suggestions", () => {
		const report = directiveReports.createUnused(stubDirective);

		expect(report).toEqual({
			about: {
				id: "commentDirectiveUnused",
			},
			message: {
				primary:
					'The flint-disable-next-line comment directive selecting "ts/noExplicitAny" did not match any reports.',
				secondary: [
					"This directive may be unnecessary if it's not suppressing any linting errors.",
					"Consider removing it if it's no longer needed.",
				],
				suggestions: [
					"If the directive is no longer needed, remove it.",
					"If you expected it to match reports, check that the rule IDs are correct.",
				],
			},
			range: stubRange,
		});
	});
});
