import rule from "./regexLookaroundAssertions.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: String.raw`
"text".replace(/(Java)Script/, "$1");
`,
			output: String.raw`
"text".replace(/(?<=Java)Script/, "");
`,
			snapshot: `
"text".replace(/(Java)Script/, "$1");
                ~~~~~~
                This capturing group can be optimized by switching to a lookaround assertion.
`,
		},
		{
			code: String.raw`
"text".replace(/Java(Script)/, "Type$1");
`,
			output: String.raw`
"text".replace(/Java(?=Script)/, "Type");
`,
			snapshot: `
"text".replace(/Java(Script)/, "Type$1");
                    ~~~~~~~~
                    This capturing group can be optimized by switching to a lookaround assertion.
`,
		},
		{
			code: String.raw`
"text".replace(/(pre)text(suf)/, "$1x$2");
`,
			output: String.raw`
"text".replace(/(?<=pre)text(?=suf)/, "x");
`,
			snapshot: `
"text".replace(/(pre)text(suf)/, "$1x$2");
                ~~~~~
                This capturing group can be optimized by switching to a lookaround assertion.
                         ~~~~~
                         This capturing group can be optimized by switching to a lookaround assertion.
`,
		},
		{
			code: String.raw`
"text".replaceAll(/(Java)Script/g, "$1");
`,
			output: String.raw`
"text".replaceAll(/(?<=Java)Script/g, "");
`,
			snapshot: `
"text".replaceAll(/(Java)Script/g, "$1");
                   ~~~~~~
                   This capturing group can be optimized by switching to a lookaround assertion.
`,
		},
		{
			code: String.raw`
"text".replace(/(a)bc(d)/, "$1-$2");
`,
			output: String.raw`
"text".replace(/(?<=a)bc(?=d)/, "-");
`,
			snapshot: `
"text".replace(/(a)bc(d)/, "$1-$2");
                ~~~
                This capturing group can be optimized by switching to a lookaround assertion.
                     ~~~
                     This capturing group can be optimized by switching to a lookaround assertion.
`,
		},
	],
	valid: [
		String.raw`"text".replace(/(pre)pattern/, replacement)`,
		String.raw`"text".replace(/(pre)pattern/, "$1-$1")`,
		String.raw`"text".replace(/(pre)pattern/, "$&")`,
		String.raw`"text".replace(/(pre)pattern/, "$$1")`,
		String.raw`"text".replace(/(a)(b)c/, "$1")`,
		String.raw`"text".replace(/(a)\1b/, "$1")`,
		String.raw`"text".replace(/a(b)c/, "$1")`,
		String.raw`"text".replace(/(a+)b/, "$1")`,
		String.raw`"text".replace(/(?<=a)b/, "c")`,
		String.raw`"text".replace(/a(?=b)/, "c")`,
		String.raw`"text".replace(/(pre)pattern/, "$<name>")`,
	],
});
