import rule from "./regexUnnecessaryDollarReplacements.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: String.raw`
"text".replace(/(a)(b)/, "$3");
`,
			snapshot: `
"text".replace(/(a)(b)/, "$3");
                          ~~
                          This replacement \`$3\` refers to a capturing group that does not exist.
`,
		},
		{
			code: String.raw`
"text".replace(/a/, "$1");
`,
			snapshot: `
"text".replace(/a/, "$1");
                     ~~
                     This replacement \`$1\` refers to a capturing group that does not exist.
`,
		},
		{
			code: String.raw`
"text".replace(/(?<first>a)/, "$<middle>");
`,
			snapshot: `
"text".replace(/(?<first>a)/, "$<middle>");
                               ~~~~~~~~~
                               This replacement \`$<middle>\` refers to a named capturing group that does not exist.
`,
		},
		{
			code: String.raw`
"text".replace(/(a)/, "$<name>");
`,
			snapshot: `
"text".replace(/(a)/, "$<name>");
                       ~~~~~~~
                       This replacement \`$<name>\` refers to a named capturing group that does not exist.
`,
		},
		{
			code: String.raw`
"text".replaceAll(/(a)/g, "$2");
`,
			snapshot: `
"text".replaceAll(/(a)/g, "$2");
                           ~~
                           This replacement \`$2\` refers to a capturing group that does not exist.
`,
		},
		{
			code: String.raw`
"text".replace(/(a)/, "$99");
`,
			snapshot: `
"text".replace(/(a)/, "$99");
                       ~~~
                       This replacement \`$99\` refers to a capturing group that does not exist.
`,
		},
		{
			code: String.raw`
"text".replace(/(?<first>a)(?<second>b)/, "$<third>");
`,
			snapshot: `
"text".replace(/(?<first>a)(?<second>b)/, "$<third>");
                                           ~~~~~~~~
                                           This replacement \`$<third>\` refers to a named capturing group that does not exist.
`,
		},
	],
	valid: [
		String.raw`"text".replace(/(a)(b)/, "$2$1")`,
		String.raw`"text".replace(/(?<first>a)/, "$<first>")`,
		String.raw`"text".replace(/a/, "$&")`,
		String.raw`"text".replace(/a/, "$$1")`,
		String.raw`"text".replace(/(a)/, "$1")`,
		String.raw`"text".replace(/(a)(b)(c)/, "$1$2$3")`,
		String.raw`"text".replaceAll(/(a)/g, "$1")`,
		String.raw`"text".replace(/a/, "$'")`,
		String.raw`"text".replace(/a/, "$\`")`,
		String.raw`"text".replace(/(a)/, "no references")`,
	],
});
