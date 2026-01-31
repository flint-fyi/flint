import { ruleTester } from "./ruleTester.ts";
import rule from "./stringStartsEndsWith.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/^foo/.test(str);
`,
			output: `
str.startsWith("foo");
`,
			snapshot: `
/^foo/.test(str);
~~~~~~
Prefer \`startsWith()\` over a regex with \`^\` for readability.
`,
		},
		{
			code: `
/bar$/.test(str);
`,
			output: `
str.endsWith("bar");
`,
			snapshot: `
/bar$/.test(str);
~~~~~~
Prefer \`endsWith()\` over a regex with \`$\` for readability.
`,
		},
		{
			code: `
/^hello/.test(myString);
`,
			output: `
myString.startsWith("hello");
`,
			snapshot: `
/^hello/.test(myString);
~~~~~~~~
Prefer \`startsWith()\` over a regex with \`^\` for readability.
`,
		},
		{
			code: `
/world$/.test(myString);
`,
			output: `
myString.endsWith("world");
`,
			snapshot: `
/world$/.test(myString);
~~~~~~~~
Prefer \`endsWith()\` over a regex with \`$\` for readability.
`,
		},
		{
			code: `
/^prefix/.test(getValue());
`,
			output: `
getValue().startsWith("prefix");
`,
			snapshot: `
/^prefix/.test(getValue());
~~~~~~~~~
Prefer \`startsWith()\` over a regex with \`^\` for readability.
`,
		},
		{
			code: `
/suffix$/.test(obj.prop);
`,
			output: `
obj.prop.endsWith("suffix");
`,
			snapshot: `
/suffix$/.test(obj.prop);
~~~~~~~~~
Prefer \`endsWith()\` over a regex with \`$\` for readability.
`,
		},
	],
	valid: [
		`/^foo$/.test(str);`,
		`/foo/.test(str);`,
		`/^foo/i.test(str);`,
		`/foo$/i.test(str);`,
		`/^foo/m.test(str);`,
		`/foo$/m.test(str);`,
		`/^foo.*/.test(str);`,
		`/.*bar$/.test(str);`,
		`/^foo+/.test(str);`,
		`/bar+$/.test(str);`,
		`/^foo[a-z]/.test(str);`,
		`/[a-z]bar$/.test(str);`,
		`/^foo?/.test(str);`,
		`/bar?$/.test(str);`,
		`str.startsWith("foo");`,
		`str.endsWith("bar");`,
		`regex.test(str);`,
	],
});
