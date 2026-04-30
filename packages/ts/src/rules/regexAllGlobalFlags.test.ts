import rule from "./regexAllGlobalFlags.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
"text".matchAll(/pattern/);
`,
			snapshot: `
"text".matchAll(/pattern/);
                ~~~~~~~~~
                The regex argument to \`matchAll()\` requires the global (\`g\`) flag.
`,
		},
		{
			code: `
"text".matchAll(/pattern/i);
`,
			snapshot: `
"text".matchAll(/pattern/i);
                ~~~~~~~~~~
                The regex argument to \`matchAll()\` requires the global (\`g\`) flag.
`,
		},
		{
			code: `
"text".replaceAll(/pattern/, "replacement");
`,
			snapshot: `
"text".replaceAll(/pattern/, "replacement");
                  ~~~~~~~~~
                  The regex argument to \`replaceAll()\` requires the global (\`g\`) flag.
`,
		},
		{
			code: `
"text".replaceAll(/pattern/i, "replacement");
`,
			snapshot: `
"text".replaceAll(/pattern/i, "replacement");
                  ~~~~~~~~~~
                  The regex argument to \`replaceAll()\` requires the global (\`g\`) flag.
`,
		},
		{
			code: `
"text".matchAll(new RegExp("pattern"));
`,
			snapshot: `
"text".matchAll(new RegExp("pattern"));
                ~~~~~~~~~~~~~~~~~~~~~
                The regex argument to \`matchAll()\` requires the global (\`g\`) flag.
`,
		},
		{
			code: `
"text".matchAll(new RegExp("pattern", "i"));
`,
			snapshot: `
"text".matchAll(new RegExp("pattern", "i"));
                ~~~~~~~~~~~~~~~~~~~~~~~~~~
                The regex argument to \`matchAll()\` requires the global (\`g\`) flag.
`,
		},
		{
			code: `
"text".replaceAll(new RegExp("pattern"), "replacement");
`,
			snapshot: `
"text".replaceAll(new RegExp("pattern"), "replacement");
                  ~~~~~~~~~~~~~~~~~~~~~
                  The regex argument to \`replaceAll()\` requires the global (\`g\`) flag.
`,
		},
		{
			code: `
"text".matchAll(RegExp("pattern"));
`,
			snapshot: `
"text".matchAll(RegExp("pattern"));
                ~~~~~~~~~~~~~~~~~
                The regex argument to \`matchAll()\` requires the global (\`g\`) flag.
`,
		},
		{
			code: `
const text = "hello world";
text.matchAll(/o/);
`,
			snapshot: `
const text = "hello world";
text.matchAll(/o/);
              ~~~
              The regex argument to \`matchAll()\` requires the global (\`g\`) flag.
`,
		},
	],
	valid: [
		`"text".matchAll(/pattern/g);`,
		`"text".matchAll(/pattern/gi);`,
		`"text".matchAll(/pattern/gm);`,
		`"text".replaceAll(/pattern/g, "replacement");`,
		`"text".replaceAll(/pattern/gi, "replacement");`,
		`"text".replaceAll("pattern", "replacement");`,
		`"text".matchAll(new RegExp("pattern", "g"));`,
		`"text".matchAll(new RegExp("pattern", "gi"));`,
		`"text".replaceAll(new RegExp("pattern", "g"), "replacement");`,
		`const flags = "gi"; "text".matchAll(new RegExp("pattern", flags));`,
		`declare const value: number[]; value.matchAll(/pattern/);`,
		`declare const items: string[]; items.replaceAll(/pattern/, "x");`,
	],
});
