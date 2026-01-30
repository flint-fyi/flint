import rule from "./regexUnusedCapturingGroups.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/(a)/;
`,
			snapshot: `
/(a)/;
 ~~~
 Capturing group \`(a)\` is never referenced.
`,
		},
		{
			code: `
/(a)(b)/;
`,
			snapshot: `
/(a)(b)/;
 ~~~
 Capturing group \`(a)\` is never referenced.
    ~~~
    Capturing group \`(b)\` is never referenced.
`,
		},
		{
			code: `
/(?<name>a)/;
`,
			snapshot: `
/(?<name>a)/;
 ~~~~~~~~~~
 Capturing group \`(?<name>a)\` is never referenced.
`,
		},
		{
			code: String.raw`
/(a)(b)\1/;
`,
			snapshot: `
/(a)(b)\\1/;
    ~~~
    Capturing group \`(b)\` is never referenced.
`,
		},
		{
			code: String.raw`
/(?<first>a)(?<second>b)\k<first>/;
`,
			snapshot: `
/(?<first>a)(?<second>b)\\k<first>/;
            ~~~~~~~~~~~~
            Capturing group \`(?<second>b)\` is never referenced.
`,
		},
		{
			code: `
new RegExp("(a)");
`,
			snapshot: `
new RegExp("(a)");
            ~~~
            Capturing group \`(a)\` is never referenced.
`,
		},
		{
			code: `
RegExp("(hello)");
`,
			snapshot: `
RegExp("(hello)");
        ~~~~~~~
        Capturing group \`(hello)\` is never referenced.
`,
		},
		{
			code: `
/(nested(group))/;
`,
			snapshot: `
/(nested(group))/;
 ~~~~~~~~~~~~~~~
 Capturing group \`(nested(group))\` is never referenced.
        ~~~~~~~
        Capturing group \`(group)\` is never referenced.
`,
		},
	],
	valid: [
		String.raw`/(a)\1/;`,
		String.raw`/\1(a)/;`,
		String.raw`/(a)(b)\1\2/;`,
		String.raw`/(?<name>a)\k<name>/;`,
		String.raw`/(?<first>a)(?<second>b)\k<first>\k<second>/;`,
		`/(?:a)/;`,
		`/(?:abc)/;`,
		`/(?=a)/;`,
		`/(?!a)/;`,
		`/(?<=a)/;`,
		`/(?<!a)/;`,
		`new RegExp("(a)\\\\1");`,
		`RegExp(variable);`,
	],
});
