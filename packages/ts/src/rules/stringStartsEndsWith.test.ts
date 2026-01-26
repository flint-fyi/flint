import rule from "./stringStartsEndsWith.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const result = /^foo/.test(str);
`,
			snapshot: `
const result = /^foo/.test(str);
               ~~~~~~
               Prefer \`startsWith()\` over a regex with \`^\`.
`,
		},
		{
			code: `
const result = /bar$/.test(str);
`,
			snapshot: `
const result = /bar$/.test(str);
               ~~~~~~
               Prefer \`endsWith()\` over a regex with \`$\`.
`,
		},
		{
			code: `
if (/^prefix/.test(input)) {
    process(input);
}
`,
			snapshot: `
if (/^prefix/.test(input)) {
    ~~~~~~~~~
    Prefer \`startsWith()\` over a regex with \`^\`.
    process(input);
}
`,
		},
		{
			code: `
const startsWithAt = /^@/.test(name);
`,
			snapshot: `
const startsWithAt = /^@/.test(name);
                     ~~~~
                     Prefer \`startsWith()\` over a regex with \`^\`.
`,
		},
		{
			code: `
/^ /.test(text);
`,
			snapshot: `
/^ /.test(text);
~~~~
Prefer \`startsWith()\` over a regex with \`^\`.
`,
		},
	],
	valid: [
		`const result = str.startsWith("foo");`,
		`const result = str.endsWith("bar");`,
		`const result = /foo/.test(str);`,
		`const result = /^foo$/i.test(str);`,
		`const result = /^foo/i.test(str);`,
		`const result = /^foo/m.test(str);`,
		`const result = /^foo$/.test(str);`,
		`const result = /^foo+/.test(str);`,
		`const result = /^foo./.test(str);`,
		`const result = /^[abc]/.test(str);`,
		`const result = /^foo|bar/.test(str);`,
		`const result = /^\\w/.test(str);`,
		`const hasExtension = /\\.js$/.test(filename);`,
	],
});
