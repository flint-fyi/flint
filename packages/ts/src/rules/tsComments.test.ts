import { ruleTester } from "./ruleTester.ts";
import rule from "./tsComments.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
// @ts-ignore
const value: string = 123;
`,
			options: {
				allowTsIgnore: true,
			},
			output: `
// @ts-expect-error
const value: string = 123;
`,
			snapshot: `
// @ts-ignore
~~~~~~~~~~~~~
Prefer \`@ts-expect-error\` instead of \`@ts-ignore\`, as \`@ts-expect-error\` triggers type errors if it becomes unnecessary.
const value: string = 123;
`,
		},
		{
			code: `
///@ts-ignore
const value: string = 123;
`,
			options: {
				allowTsIgnore: true,
			},
			output: `
///@ts-expect-error
const value: string = 123;
`,
			snapshot: `
///@ts-ignore
~~~~~~~~~~~~~
Prefer \`@ts-expect-error\` instead of \`@ts-ignore\`, as \`@ts-expect-error\` triggers type errors if it becomes unnecessary.
const value: string = 123;
`,
		},
		{
			code: `
// @ts-ignore: some reason
const value: string = 123;
`,
			options: {
				allowTsIgnore: true,
			},
			output: `
// @ts-expect-error: some reason
const value: string = 123;
`,
			snapshot: `
// @ts-ignore: some reason
~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`@ts-expect-error\` instead of \`@ts-ignore\`, as \`@ts-expect-error\` triggers type errors if it becomes unnecessary.
const value: string = 123;
`,
		},
		{
			code: `
// @ts-nocheck
const value = 1;
`,
			options: {
				allowTsNocheck: true,
			},
			snapshot: `
// @ts-nocheck
~~~~~~~~~~~~~~
This project does not allow using \`@ts-nocheck\` to suppress compilation errors.
const value = 1;
`,
		},
		{
			code: `
/* @ts-ignore */
const value: string = 123;
`,
			options: {
				allowTsIgnore: true,
			},
			output: `
/* @ts-expect-error */
const value: string = 123;
`,
			snapshot: `
/* @ts-ignore */
~~~~~~~~~~~~~~~~
Prefer \`@ts-expect-error\` instead of \`@ts-ignore\`, as \`@ts-expect-error\` triggers type errors if it becomes unnecessary.
const value: string = 123;
`,
		},
		{
			code: `
// @ts-expect-error
const value: string = 123;
`,
			options: {
				allowTsExpectError: "allow-with-description",
			},
			snapshot: `
// @ts-expect-error
~~~~~~~~~~~~~~~~~~~
\`@ts-expect-error\` should include a description of at least 10 characters.
const value: string = 123;
`,
		},
		{
			code: `
// @ts-expect-error:
const value: string = 123;
`,
			options: {
				allowTsExpectError: "allow-with-description",
			},
			snapshot: `
// @ts-expect-error:
~~~~~~~~~~~~~~~~~~~~
\`@ts-expect-error\` should include a description of at least 10 characters.
const value: string = 123;
`,
		},
		{
			code: `
// @ts-expect-error: short
const value: string = 123;
`,
			options: {
				allowTsExpectError: "allow-with-description",
			},
			snapshot: `
// @ts-expect-error: short
~~~~~~~~~~~~~~~~~~~~~~~~~~
\`@ts-expect-error\` should include a description of at least 10 characters.
const value: string = 123;
`,
		},
		{
			code: `
// @ts-expect-error
const value: string = 123;
`,
			options: {
				allowTsExpectError: true,
			},
			snapshot: `
// @ts-expect-error
~~~~~~~~~~~~~~~~~~~
This project does not allow using \`@ts-expect-error\` to suppress compilation errors.
const value: string = 123;
`,
		},
		{
			code: `
// @ts-expect-error: has description
const value: string = 123;
`,
			options: {
				allowTsExpectError: true,
			},
			snapshot: `
// @ts-expect-error: has description
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
This project does not allow using \`@ts-expect-error\` to suppress compilation errors.
const value: string = 123;
`,
		},
		{
			code: `
// @ts-ignore
const value: string = 123;
`,
			options: {
				allowTsIgnore: "allow-with-description",
			},
			output: `
// @ts-expect-error
const value: string = 123;
`,
			snapshot: `
// @ts-ignore
~~~~~~~~~~~~~
\`@ts-ignore\` should include a description of at least 10 characters.
const value: string = 123;
`,
		},
		{
			code: `
// @ts-ignore: ab
const value: string = 123;
`,
			options: {
				allowTsIgnore: "allow-with-description",
			},
			output: `
// @ts-expect-error: ab
const value: string = 123;
`,
			snapshot: `
// @ts-ignore: ab
~~~~~~~~~~~~~~~~~
\`@ts-ignore\` should include a description of at least 10 characters.
const value: string = 123;
`,
		},
		{
			code: `
// @ts-nocheck
const value = 1;
`,
			options: {
				allowTsNocheck: "allow-with-description",
			},
			snapshot: `
// @ts-nocheck
~~~~~~~~~~~~~~
\`@ts-nocheck\` should include a description of at least 10 characters.
const value = 1;
`,
		},
		{
			code: `
// @ts-nocheck:
const value = 1;
`,
			options: {
				allowTsNocheck: "allow-with-description",
			},
			snapshot: `
// @ts-nocheck:
~~~~~~~~~~~~~~~
\`@ts-nocheck\` should include a description of at least 10 characters.
const value = 1;
`,
		},
		{
			code: `
// @ts-expect-error: short
const value: string = 123;
`,
			options: {
				allowTsExpectError: "allow-with-description",
				minimumDescriptionLength: 15,
			},
			snapshot: `
// @ts-expect-error: short
~~~~~~~~~~~~~~~~~~~~~~~~~~
\`@ts-expect-error\` should include a description of at least 15 characters.
const value: string = 123;
`,
		},
		{
			code: `
// @ts-expect-error: random description
const value: string = 123;
`,
			options: {
				allowTsExpectError: { descriptionFormat: "^: TS\\d+ because .+$" },
				minimumDescriptionLength: 0,
			},
			snapshot: `
// @ts-expect-error: random description
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
The description for \`ts-expect-error\` does not match the preferred format: ^: TS\\d+ because .+$.
const value: string = 123;
`,
		},
		{
			code: `
// @ts-expect-error: TS123
const value: string = 123;
`,
			options: {
				allowTsExpectError: { descriptionFormat: "^: TS\\d+ because .+$" },
				minimumDescriptionLength: 0,
			},
			snapshot: `
// @ts-expect-error: TS123
~~~~~~~~~~~~~~~~~~~~~~~~~~
The description for \`ts-expect-error\` does not match the preferred format: ^: TS\\d+ because .+$.
const value: string = 123;
`,
		},
		{
			code: `
// @ts-ignore: bad format
const value: string = 123;
`,
			options: {
				allowTsIgnore: { descriptionFormat: "^: ISSUE-\\d+" },
				minimumDescriptionLength: 0,
			},
			output: `
// @ts-expect-error: bad format
const value: string = 123;
`,
			snapshot: `
// @ts-ignore: bad format
~~~~~~~~~~~~~~~~~~~~~~~~~
The description for \`ts-ignore\` does not match the preferred format: ^: ISSUE-\\d+.
const value: string = 123;
`,
		},
		{
			code: `
/* @ts-ignore: short */
const value: string = 123;
`,
			options: {
				allowTsIgnore: "allow-with-description",
				allowTsNocheck: "allow-with-description",
				minimumDescriptionLength: 15,
			},
			output: `
/* @ts-expect-error: short */
const value: string = 123;
`,
			snapshot: `
/* @ts-ignore: short */
~~~~~~~~~~~~~~~~~~~~~~~
\`@ts-ignore\` should include a description of at least 15 characters.
const value: string = 123;
`,
		},
		{
			code: `
/* @ts-nocheck */
const value = 1;
`,
			options: {
				allowTsIgnore: "allow-with-description",
				allowTsNocheck: "allow-with-description",
				minimumDescriptionLength: 15,
			},
			snapshot: `
/* @ts-nocheck */
~~~~~~~~~~~~~~~~~
\`@ts-nocheck\` should include a description of at least 15 characters.
const value = 1;
`,
		},
		{
			code: `
// @ts-expect-error abc
const value: string = 123;
`,
			options: {
				allowTsExpectError: "allow-with-description",
				minimumDescriptionLength: 15,
			},
			snapshot: `
// @ts-expect-error abc
~~~~~~~~~~~~~~~~~~~~~~~
\`@ts-expect-error\` should include a description of at least 15 characters.
const value: string = 123;
`,
		},
	],
	valid: [
		`// @ts-expect-error: valid reason here
const value: string = 123;
`,
		`// @ts-expect-error - valid reason here
const value: string = 123;
`,
		`// @ts-check
const value = 1;
`,
		`// Regular comment`,
		`const value = 1;
`,
		`// This is not a @ts-ignore directive`,
		`// @ts-ignore
const value: string = 123;
`,
		`// @ts-expect-error
const value: string = 123;
`,
		`// @ts-nocheck
const value = 1;
`,
		{
			code: `
// @ts-ignore: this is allowed with description
const value: string = 123;
`,
			options: {
				allowTsIgnore: "allow-with-description",
			},
		},
		{
			code: `
// @ts-ignore - reason given here
const value: string = 123;
`,
			options: {
				allowTsIgnore: "allow-with-description",
			},
		},
		{
			code: `
// @ts-nocheck: valid reason here
const value = 1;
`,
			options: {
				allowTsNocheck: "allow-with-description",
			},
		},
		{
			code: `
// @ts-expect-error: this is a long enough description
const value: string = 123;
`,
			options: {
				allowTsExpectError: "allow-with-description",
				minimumDescriptionLength: 15,
			},
		},
		{
			code: `
// @ts-expect-error: TS2322 because we need to test this
const value: string = 123;
`,
			options: {
				allowTsExpectError: { descriptionFormat: "^: TS\\d+ because .+$" },
				minimumDescriptionLength: 0,
			},
		},
		{
			code: `
// @ts-ignore: ISSUE-123 fixed in next release
const value: string = 123;
`,
			options: {
				allowTsIgnore: { descriptionFormat: "^: ISSUE-\\d+" },
				minimumDescriptionLength: 0,
			},
		},
		{
			code: `
/* @ts-ignore: this is a long enough description */
const value: string = 123;
`,
			options: {
				allowTsIgnore: "allow-with-description",
				allowTsNocheck: "allow-with-description",
				minimumDescriptionLength: 15,
			},
		},
		{
			code: `
/* @ts-expect-error: this is also valid */
const value: string = 123;
`,
			options: {
				allowTsExpectError: "allow-with-description",
				allowTsIgnore: "allow-with-description",
				allowTsNocheck: "allow-with-description",
				minimumDescriptionLength: 15,
			},
		},
		{
			code: `
// @ts-expect-error this is long enough
const value: string = 123;
`,
			options: {
				allowTsExpectError: "allow-with-description",
				minimumDescriptionLength: 15,
			},
		},
	],
});
