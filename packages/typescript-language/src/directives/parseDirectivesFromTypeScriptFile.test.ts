import ts from "typescript";
import { describe, expect, it } from "vitest";

import type * as AST from "../types/ast.ts";
import {
	extractDirectivesFromTypeScriptFile,
	parseDirectivesFromTypeScriptFile,
} from "./parseDirectivesFromTypeScriptFile.ts";

describe(parseDirectivesFromTypeScriptFile, () => {
	it("returns empty arrays when there are no directives", () => {
		const sourceFile = ts.createSourceFile(
			"test.ts",
			"// unrelated",
			ts.ScriptTarget.ESNext,
			true,
		) as AST.SourceFile;

		const actual = parseDirectivesFromTypeScriptFile(sourceFile);

		expect(actual).toEqual({
			directives: [],
			reports: [],
		});
	});

	it("returns parsed directives when there are comment directives", () => {
		const sourceFile = ts.createSourceFile(
			"test.ts",
			`
                // flint-disable-file a
                // flint-disable-next-line b
                // flint-invalid
            `,
			ts.ScriptTarget.ESNext,
			true,
		) as AST.SourceFile;

		const actual = parseDirectivesFromTypeScriptFile(sourceFile);

		expect(actual).toMatchInlineSnapshot(`
			{
			  "directives": [
			    {
			      "range": {
			        "begin": {
			          "column": 16,
			          "line": 1,
			          "raw": 17,
			        },
			        "end": {
			          "column": 39,
			          "line": 1,
			          "raw": 40,
			        },
			      },
			      "selections": [
			        "a",
			      ],
			      "type": "disable-file",
			    },
			    {
			      "range": {
			        "begin": {
			          "column": 16,
			          "line": 2,
			          "raw": 57,
			        },
			        "end": {
			          "column": 44,
			          "line": 2,
			          "raw": 85,
			        },
			      },
			      "selections": [
			        "b",
			      ],
			      "type": "disable-next-line",
			    },
			  ],
			  "reports": [
			    {
			      "about": {
			        "id": "commentDirectiveUnknown",
			      },
			      "message": {
			        "primary": "Unknown comment directive type: "invalid".",
			        "secondary": [
			          "Flint supports "disable-file", "disable-lines-begin", "disable-lines-end", and "disable-next-line" directive types.",
			          "Unrecognized directive types are ignored and will not suppress any linting reports.",
			        ],
			        "suggestions": [
			          "Change the directive to one of the supported types.",
			          "If this comment is not intended as a Flint directive, change the comment so it does not begin with "flint-".",
			        ],
			      },
			      "range": {
			        "begin": {
			          "column": 16,
			          "line": 3,
			          "raw": 102,
			        },
			        "end": {
			          "column": 32,
			          "line": 3,
			          "raw": 118,
			        },
			      },
			    },
			  ],
			}
		`);
	});

	it("reports commentDirectiveNoSelection when a directive has no selections", () => {
		const sourceFile = createSourceFile(
			"// flint-disable-next-line\nconst x = 1;",
		);

		const actual = parseDirectivesFromTypeScriptFile(sourceFile);

		expect(actual.reports).toMatchInlineSnapshot(`
			[
			  {
			    "about": {
			      "id": "commentDirectiveNoSelection",
			    },
			    "message": {
			      "primary": "Comment directive "disable-next-line" needs to select rule(s).",
			      "secondary": [
			        "Comment directives require at least one rule name or wildcard pattern.",
			        "Without any specified rules, the directive cannot determine what to disable and has no effect.",
			      ],
			      "suggestions": [
			        "Specify one or more rule names or patterns after the directive type, such as "flint-disable-next-line plugin/ruleName".",
			        "If the directive is no longer needed, remove it.",
			      ],
			    },
			    "range": {
			      "begin": {
			        "column": 0,
			        "line": 0,
			        "raw": 0,
			      },
			      "end": {
			        "column": 26,
			        "line": 0,
			        "raw": 26,
			      },
			    },
			  },
			]
		`);
	});

	it("reports commentDirectiveFileAfterContent when disable-file is after statements", () => {
		const sourceFile = createSourceFile(
			"const x = 1;\n// flint-disable-file ts/noExplicitAny",
		);

		const actual = parseDirectivesFromTypeScriptFile(sourceFile);

		expect(actual.reports).toMatchInlineSnapshot(`
			[
			  {
			    "about": {
			      "id": "commentDirectiveFileAfterContent",
			    },
			    "message": {
			      "primary": "A "flint-disable-file" comment directive must come before any non-comment contents.",
			      "secondary": [
			        "File-level disable directives apply to the entire file and are meant to be placed at the top.",
			        "Placing them after code can be confusing because it looks like a regional disable rather than a file-wide one.",
			      ],
			      "suggestions": [
			        "Move the "flint-disable-file" directive to the top of the file, before any statements.",
			        "If you only intended to disable rules for part of the file, use "flint-disable-next-line" or "flint-disable-lines-begin" instead.",
			      ],
			    },
			    "range": {
			      "begin": {
			        "column": 0,
			        "line": 1,
			        "raw": 13,
			      },
			      "end": {
			        "column": 38,
			        "line": 1,
			        "raw": 51,
			      },
			    },
			  },
			]
		`);
	});

	it("reports commentDirectiveAlreadyDisabled when a rule is disabled redundantly", () => {
		const sourceFile = createSourceFile(
			[
				"// flint-disable-file ts/noExplicitAny",
				"// flint-disable-next-line ts/noExplicitAny",
				"const x = 1;",
			].join("\n"),
		);

		const actual = parseDirectivesFromTypeScriptFile(sourceFile);

		expect(actual.reports).toMatchInlineSnapshot(`
			[
			  {
			    "about": {
			      "id": "commentDirectiveAlreadyDisabled",
			    },
			    "message": {
			      "primary": "The selection "ts/noExplicitAny" is already disabled by a previous flint-disable-next-line comment directive.",
			      "secondary": [
			        "Disabling a rule multiple times in the same scope is redundant.",
			        "Redundant directives add noise and can make it harder to tell which directive is active.",
			      ],
			      "suggestions": [
			        "Remove this redundant directive.",
			        "If the earlier directive was unintentional, remove or adjust that directive instead.",
			      ],
			    },
			    "range": {
			      "begin": {
			        "column": 0,
			        "line": 1,
			        "raw": 39,
			      },
			      "end": {
			        "column": 43,
			        "line": 1,
			        "raw": 82,
			      },
			    },
			  },
			]
		`);
	});

	it("reports commentDirectiveNotPreviouslyDisabled when disable-lines-end has no matching begin", () => {
		const sourceFile = createSourceFile(
			"// flint-disable-lines-end ts/noExplicitAny\nconst x = 1;",
		);

		const actual = parseDirectivesFromTypeScriptFile(sourceFile);

		expect(actual.reports).toMatchInlineSnapshot(`
			[
			  {
			    "about": {
			      "id": "commentDirectiveNotPreviouslyDisabled",
			    },
			    "message": {
			      "primary": "The selection "ts/noExplicitAny" was not disabled in a previous comment directive.",
			      "secondary": [
			        "A "disable-lines-end" directive should only close rule selections previously opened by a "disable-lines-begin" directive.",
			        "Closing a selection that was never opened has no effect and usually indicates a mismatched rule name or missing begin directive.",
			      ],
			      "suggestions": [
			        "Verify that the rule name matches the one used in the preceding "flint-disable-lines-begin" directive.",
			        "Add a preceding "flint-disable-lines-begin" directive if one is missing.",
			        "If the directive is no longer needed, remove it.",
			      ],
			    },
			    "range": {
			      "begin": {
			        "column": 0,
			        "line": 0,
			        "raw": 0,
			      },
			      "end": {
			        "column": 43,
			        "line": 0,
			        "raw": 43,
			      },
			    },
			  },
			]
		`);
	});
});

function createSourceFile(content: string) {
	return ts.createSourceFile(
		"test.ts",
		content,
		ts.ScriptTarget.ESNext,
		true,
	) as AST.SourceFile;
}

describe(extractDirectivesFromTypeScriptFile, () => {
	it("leaves range on the directive line when no comments intervene", () => {
		const sourceFile = createSourceFile(
			["// flint-disable-next-line a", "const x = 1;"].join("\n"),
		);

		const directives = extractDirectivesFromTypeScriptFile(sourceFile);

		expect(directives[0]?.range.end.line).toBe(0);
	});

	it("extends range over single-line comments before the code line", () => {
		const sourceFile = createSourceFile(
			[
				"// flint-disable-next-line a",
				"// explanation comment",
				"const x = 1;",
			].join("\n"),
		);

		const directives = extractDirectivesFromTypeScriptFile(sourceFile);

		expect(directives[0]?.range.end.line).toBe(1);
	});

	it("extends range over single-line block comments before the code line", () => {
		const sourceFile = createSourceFile(
			[
				"// flint-disable-next-line a",
				"/* block comment */",
				"const x = 1;",
			].join("\n"),
		);

		const directives = extractDirectivesFromTypeScriptFile(sourceFile);

		expect(directives[0]?.range.end.line).toBe(1);
	});

	it("extends range over multi-line block comments before the code line", () => {
		const sourceFile = createSourceFile(
			[
				"// flint-disable-next-line a",
				"/* block comment",
				"   still comment */",
				"const x = 1;",
			].join("\n"),
		);

		const directives = extractDirectivesFromTypeScriptFile(sourceFile);

		expect(directives[0]?.range.end.line).toBe(2);
	});

	it("does not extend range when an empty line is encountered", () => {
		const sourceFile = createSourceFile(
			["// flint-disable-next-line a", "", "const x = 1;"].join("\n"),
		);

		const directives = extractDirectivesFromTypeScriptFile(sourceFile);

		expect(directives[0]?.range.end.line).toBe(0);
	});

	it("does not extend range when the directive is at end of file", () => {
		const sourceFile = createSourceFile("// flint-disable-next-line a");

		const directives = extractDirectivesFromTypeScriptFile(sourceFile);

		expect(directives[0]?.range.end.line).toBe(0);
	});

	it("treats a line with a block comment followed by code as a code line", () => {
		const sourceFile = createSourceFile(
			["// flint-disable-next-line a", "/* reason */ const x = 1;"].join("\n"),
		);

		const directives = extractDirectivesFromTypeScriptFile(sourceFile);

		expect(directives[0]?.range.end.line).toBe(0);
	});

	it("treats a line with multiple block comments followed by code as a code line", () => {
		const sourceFile = createSourceFile(
			["// flint-disable-next-line a", "/* a */ /* b */ const x = 1;"].join(
				"\n",
			),
		);

		const directives = extractDirectivesFromTypeScriptFile(sourceFile);

		expect(directives[0]?.range.end.line).toBe(0);
	});

	it("extends range over comment lines before block comment + code line", () => {
		const sourceFile = createSourceFile(
			[
				"// flint-disable-next-line a",
				"// explanation",
				"/* reason */ const x = 1;",
			].join("\n"),
		);

		const directives = extractDirectivesFromTypeScriptFile(sourceFile);

		expect(directives[0]?.range.end.line).toBe(1);
	});

	it("targets the closing line of a multi-line block comment when it contains code", () => {
		const sourceFile = createSourceFile(
			["// flint-disable-next-line a", "/* reason", " */ const x = 1;"].join(
				"\n",
			),
		);

		const directives = extractDirectivesFromTypeScriptFile(sourceFile);

		expect(directives[0]?.range.end.line).toBe(1);
	});

	it("extends range over a line where block comment remainder is a line comment", () => {
		const sourceFile = createSourceFile(
			[
				"// flint-disable-next-line a",
				"/* reason */ // note",
				"const x = 1;",
			].join("\n"),
		);

		const directives = extractDirectivesFromTypeScriptFile(sourceFile);

		expect(directives[0]?.range.end.line).toBe(1);
	});

	it("extends range over a multiline block comment closing line followed only by another block comment", () => {
		const sourceFile = createSourceFile(
			[
				"// flint-disable-next-line a",
				"/* reason",
				" */ /* note */",
				"const x = 1;",
			].join("\n"),
		);

		const directives = extractDirectivesFromTypeScriptFile(sourceFile);

		expect(directives[0]?.range.end.line).toBe(2);
	});

	it("extends range over a multiline block comment whose closing line chains into another multiline block comment", () => {
		const sourceFile = createSourceFile(
			[
				"// flint-disable-next-line a",
				"/* reason",
				" */ /* note",
				" still note */",
				"const x = 1;",
			].join("\n"),
		);

		const directives = extractDirectivesFromTypeScriptFile(sourceFile);

		expect(directives[0]?.range.end.line).toBe(3);
	});

	it("does not extend range for non-disable-next-line directives", () => {
		const sourceFile = createSourceFile(
			["// flint-disable-file a", "const x = 1;"].join("\n"),
		);

		const directives = extractDirectivesFromTypeScriptFile(sourceFile);

		expect(directives[0]?.range.end.line).toBe(0);
	});
});
