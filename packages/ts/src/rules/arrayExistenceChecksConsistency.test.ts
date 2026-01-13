import rule from "./arrayExistenceChecksConsistency.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
if (values.indexOf("test") < 0) {}
`,
			output: `
if (values.indexOf("test") === -1) {}
`,
			snapshot: `
if (values.indexOf("test") < 0) {}
                           ~~~
                           Prefer \`values.indexOf("test") === -1\` over \`values.indexOf("test") < 0\` to check for non-existence.
`,
		},
		{
			code: `
if (values.indexOf("test") >= 0) {}
`,
			output: `
if (values.indexOf("test") !== -1) {}
`,
			snapshot: `
if (values.indexOf("test") >= 0) {}
                           ~~~~
                           Prefer \`values.indexOf("test") !== -1\` over \`values.indexOf("test") >= 0\` to check for existence.
`,
		},
		{
			code: `
if (values.indexOf("test") > -1) {}
`,
			output: `
if (values.indexOf("test") !== -1) {}
`,
			snapshot: `
if (values.indexOf("test") > -1) {}
                           ~~~~
                           Prefer \`values.indexOf("test") !== -1\` over \`values.indexOf("test") > -1\` to check for existence.
`,
		},
		{
			code: `
if (values.lastIndexOf("test") < 0) {}
`,
			output: `
if (values.lastIndexOf("test") === -1) {}
`,
			snapshot: `
if (values.lastIndexOf("test") < 0) {}
                               ~~~
                               Prefer \`values.lastIndexOf("test") === -1\` over \`values.lastIndexOf("test") < 0\` to check for non-existence.
`,
		},
		{
			code: `
if (values.findIndex((value) => value > 10) < 0) {}
`,
			output: `
if (values.findIndex((value) => value > 10) === -1) {}
`,
			snapshot: `
if (values.findIndex((value) => value > 10) < 0) {}
                                            ~~~
                                            Prefer \`values.findIndex((value) => value > 10) === -1\` over \`values.findIndex((value) => value > 10) < 0\` to check for non-existence.
`,
		},
		{
			code: `
if (values.findLastIndex((value) => value > 10) >= 0) {}
`,
			output: `
if (values.findLastIndex((value) => value > 10) !== -1) {}
`,
			snapshot: `
if (values.findLastIndex((value) => value > 10) >= 0) {}
                                                ~~~~
                                                Prefer \`values.findLastIndex((value) => value > 10) !== -1\` over \`values.findLastIndex((value) => value > 10) >= 0\` to check for existence.
`,
		},
	],
	valid: [
		`if (index === -1) {}`,
		`if (index !== -1) {}`,
		`if (values.indexOf("test") === -1) {}`,
		`if (values.indexOf("test") !== -1) {}`,
		`if (values.lastIndexOf("test") === -1) {}`,
		`if (values.findIndex((value) => value > 10) === -1) {}`,
		`if (values.findLastIndex((value) => value > 10) !== -1) {}`,
		`if (index < 1) {}`,
		`if (index >= 1) {}`,
		`if (someOtherCall() < 0) {}`,
		`if (values.map((v) => v) < 0) {}`,
	],
});
