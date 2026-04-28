import {
	getColumnAndLineOfPosition,
	type NormalizedReport,
} from "@flint.fyi/core";
import { describe, expect, it } from "vitest";

import { createReportSnapshot } from "./createReportSnapshot.ts";

describe("createReportSnapshot", () => {
	it.each([
		{
			expected: "const value = 1;",
			reports: [],
			sourceText: "const value = 1;",
		},
		{
			expected: `const value = 1;
      ~~~~~
      Use a different value.`,
			reports: [
				createReport("const value = 1;", 6, 11, "Use a different value."),
			],
			sourceText: "const value = 1;",
		},
		{
			expected: `const count = 1;
      ~~~~~
      Avoid count.`,
			reports: [
				createReport("const count = 1;", 6, 11, "Avoid {{ name }}.", {
					name: "count",
				}),
			],
			sourceText: "const count = 1;",
		},
		{
			expected: `

Property \`example\` is expected to be present.
{}
`,
			reports: [
				createReport(
					`
{}
`,
					0,
					0,
					"Property `example` is expected to be present.",
				),
			],
			sourceText: `
{}
`,
		},
		{
			expected: `

Property \`example\` is expected to be present.
{}
`,
			reports: [
				createReport(
					`
{}
`,
					0,
					1,
					"Property `example` is expected to be present.",
				),
			],
			sourceText: `
{}
`,
		},
		{
			expected: `

Property \`example\` is expected to be present.
{}`,
			reports: [
				createReport(
					`
{}`,
					0,
					1,
					"Property `example` is expected to be present.",
				),
			],
			sourceText: `
{}`,
		},
		{
			expected: `

Property \`example\` is expected to be present.

{}`,
			reports: [
				createReport(
					`

{}`,
					0,
					1,
					"Property `example` is expected to be present.",
				),
			],
			sourceText: `

{}`,
		},
		{
			expected: `

Property \`example\` is expected to be present.


{}`,
			reports: [
				createReport(
					`


{}`,
					0,
					1,
					"Property `example` is expected to be present.",
				),
			],
			sourceText: `


{}`,
		},
		{
			expected: `{}
~
Property \`example\` is expected to be present.
`,
			reports: [
				createReport(
					`{}
`,
					0,
					1,
					"Property `example` is expected to be present.",
				),
			],
			sourceText: `{}
`,
		},
		{
			expected: `

Property \`example\` is expected to be present.
{
  "other": true
}
`,
			reports: [
				createReport(
					`
{
  "other": true
}
`,
					0,
					1,
					"Property `example` is expected to be present.",
				),
			],
			sourceText: `
{
  "other": true
}
`,
		},
		{
			expected: `  call(value);
       ~~~~~
       Avoid this call.
       Use another value.`,
			reports: [
				createReport(
					"  call(value);",
					7,
					12,
					"Avoid this call.\nUse another value.",
				),
			],
			sourceText: "  call(value);",
		},
		{
			expected: `alpha(
  beta,
  ~~~~~
  Avoid multiline calls.
  gamma
  ~~~~~
);`,
			reports: [
				createReport(
					`alpha(
  beta,
  gamma
);`,
					9,
					22,
					"Avoid multiline calls.",
				),
			],
			sourceText: `alpha(
  beta,
  gamma
);`,
		},
		{
			expected: `first();
~~~~~
First issue.
second();
~~~~~~
Second issue.`,
			reports: [
				createReport(
					`first();
second();`,
					0,
					5,
					"First issue.",
				),
				createReport(
					`first();
second();`,
					9,
					15,
					"Second issue.",
				),
			],
			sourceText: `first();
second();`,
		},
	])("$sourceText", ({ expected, reports, sourceText }) => {
		const result = createReportSnapshot(sourceText, reports);

		expect(result).toEqual(expected);
	});
});

function createReport(
	sourceText: string,
	begin: number,
	end: number,
	primary: string,
	data?: NormalizedReport["data"],
): NormalizedReport {
	return {
		...(data === undefined ? {} : { data }),
		message: {
			primary,
			secondary: [],
			suggestions: [],
		},
		range: {
			begin: getColumnAndLineOfPosition(sourceText, begin),
			end: getColumnAndLineOfPosition(sourceText, end),
		},
	};
}
