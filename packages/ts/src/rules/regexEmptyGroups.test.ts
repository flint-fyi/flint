import rule from "./regexEmptyGroups.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/()/;
`,
			snapshot: `
/()/;
 ~~
 Empty capturing group \`()\` matches nothing.
`,
		},
		{
			code: `
/(?:)/;
`,
			snapshot: `
/(?:)/;
 ~~~~
 Empty non-capturing group \`(?:)\` matches nothing.
`,
		},
		{
			code: `
/(|)/;
`,
			snapshot: `
/(|)/;
 ~~~
 Empty capturing group \`(|)\` matches nothing.
`,
		},
		{
			code: `
/(?:|)/;
`,
			snapshot: `
/(?:|)/;
 ~~~~~
 Empty non-capturing group \`(?:|)\` matches nothing.
`,
		},
		{
			code: `
/(||)/;
`,
			snapshot: `
/(||)/;
 ~~~~
 Empty capturing group \`(||)\` matches nothing.
`,
		},
		{
			code: `
new RegExp("()");
`,
			snapshot: `
new RegExp("()");
            ~~
            Empty capturing group \`()\` matches nothing.
`,
		},
		{
			code: `
new RegExp("(?:)");
`,
			snapshot: `
new RegExp("(?:)");
            ~~~~
            Empty non-capturing group \`(?:)\` matches nothing.
`,
		},
		{
			code: `
RegExp("()");
`,
			snapshot: `
RegExp("()");
        ~~
        Empty capturing group \`()\` matches nothing.
`,
		},
		{
			code: `
/a()/;
`,
			snapshot: `
/a()/;
  ~~
  Empty capturing group \`()\` matches nothing.
`,
		},
		{
			code: `
/()b/;
`,
			snapshot: `
/()b/;
 ~~
 Empty capturing group \`()\` matches nothing.
`,
		},
		{
			code: `
/a()b/;
`,
			snapshot: `
/a()b/;
  ~~
  Empty capturing group \`()\` matches nothing.
`,
		},
		{
			code: `
/(?:())a/;
`,
			snapshot: `
/(?:())a/;
    ~~
    Empty capturing group \`()\` matches nothing.
`,
		},
	],
	valid: [
		`/(a)/;`,
		`/(?:a)/;`,
		`/(a|)/;`,
		`/(?:a|)/;`,
		`/(|a)/;`,
		`/(a|b)/;`,
		`/(?:a|b)/;`,
		String.raw`/(?:a|[\q{}])/v;`,
		`/(a|b|)/;`,
		`/[a-z]/;`,
		`/a+/;`,
		`new RegExp("(a)");`,
		`new RegExp("(?:a)");`,
		`RegExp("(a|b)");`,
		`RegExp(variable);`,
	],
});
