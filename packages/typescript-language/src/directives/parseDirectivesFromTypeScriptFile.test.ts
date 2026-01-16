import ts from "typescript";
import { describe, expect, it } from "vitest";

import { parseDirectivesFromTypeScriptFile } from "./parseDirectivesFromTypeScriptFile.ts";

describe(parseDirectivesFromTypeScriptFile, () => {
	it("returns empty arrays when there are no directives", () => {
		const sourceFile = ts.createSourceFile(
			"test.ts",
			"// unrelated",
			ts.ScriptTarget.ESNext,
			true,
		);

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
		);

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
