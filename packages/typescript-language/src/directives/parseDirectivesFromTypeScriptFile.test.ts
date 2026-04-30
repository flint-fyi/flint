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
			          "TODO",
			        ],
			        "suggestions": [
			          "TODO",
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
