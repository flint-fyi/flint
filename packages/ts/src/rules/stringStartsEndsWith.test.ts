import { ruleTester } from "./ruleTester.ts";
import rule from "./stringStartsEndsWith.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const str: string;
/^foo/.test(str);
`,
			output: `
declare const str: string;
str.startsWith("foo");
`,
			snapshot: `
declare const str: string;
/^foo/.test(str);
~~~~~~
Prefer \`startsWith()\` over a regex with \`^\` for readability.
`,
		},
		{
			code: `
declare const str: string;
/bar$/.test(str);
`,
			output: `
declare const str: string;
str.endsWith("bar");
`,
			snapshot: `
declare const str: string;
/bar$/.test(str);
~~~~~~
Prefer \`endsWith()\` over a regex with \`$\` for readability.
`,
		},
		{
			code: `
declare const myString: string;
/^hello/.test(myString);
`,
			output: `
declare const myString: string;
myString.startsWith("hello");
`,
			snapshot: `
declare const myString: string;
/^hello/.test(myString);
~~~~~~~~
Prefer \`startsWith()\` over a regex with \`^\` for readability.
`,
		},
		{
			code: `
declare const myString: string;
/world$/.test(myString);
`,
			output: `
declare const myString: string;
myString.endsWith("world");
`,
			snapshot: `
declare const myString: string;
/world$/.test(myString);
~~~~~~~~
Prefer \`endsWith()\` over a regex with \`$\` for readability.
`,
		},
		{
			code: `
declare function getValue(): string;
/^prefix/.test(getValue());
`,
			output: `
declare function getValue(): string;
getValue().startsWith("prefix");
`,
			snapshot: `
declare function getValue(): string;
/^prefix/.test(getValue());
~~~~~~~~~
Prefer \`startsWith()\` over a regex with \`^\` for readability.
`,
		},
		{
			code: `
declare const obj: { prop: string };
/suffix$/.test(obj.prop);
`,
			output: `
declare const obj: { prop: string };
obj.prop.endsWith("suffix");
`,
			snapshot: `
declare const obj: { prop: string };
/suffix$/.test(obj.prop);
~~~~~~~~~
Prefer \`endsWith()\` over a regex with \`$\` for readability.
`,
		},
	],
	valid: [
		`declare const str: string; /^foo$/.test(str);`,
		`declare const str: string; /foo/.test(str);`,
		`declare const str: string; /^foo/i.test(str);`,
		`declare const str: string; /foo$/i.test(str);`,
		`declare const str: string; /^foo/m.test(str);`,
		`declare const str: string; /foo$/m.test(str);`,
		`declare const str: string; /^foo.*/.test(str);`,
		`declare const str: string; /.*bar$/.test(str);`,
		`declare const str: string; /^foo+/.test(str);`,
		`declare const str: string; /bar+$/.test(str);`,
		`declare const str: string; /^foo[a-z]/.test(str);`,
		`declare const str: string; /[a-z]bar$/.test(str);`,
		`declare const str: string; /^foo?/.test(str);`,
		`declare const str: string; /bar?$/.test(str);`,
		`declare const str: string; str.startsWith("foo");`,
		`declare const str: string; str.endsWith("bar");`,
		`
declare const regex: RegExp;
declare const str: string;

regex.test(str);
`,
	],
});
