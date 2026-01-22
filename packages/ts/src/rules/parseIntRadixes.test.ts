import rule from "./parseIntRadixes.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
parseInt("10");
`,
			snapshot: `
parseInt("10");
~~~~~~~~~~~~~~
This \`parseInt\` call is missing a radix parameter to specify the numeral system base.
`,
		},
		{
			code: `
parseInt("10", 1);
`,
			snapshot: `
parseInt("10", 1);
               ~
               Invalid radix parameter; must be an integer between 2 and 36.
`,
		},
		{
			code: `
parseInt("10", 37);
`,
			snapshot: `
parseInt("10", 37);
               ~~
               Invalid radix parameter; must be an integer between 2 and 36.
`,
		},
		{
			code: `
parseInt("10", 0);
`,
			snapshot: `
parseInt("10", 0);
               ~
               Invalid radix parameter; must be an integer between 2 and 36.
`,
		},
		{
			code: `
parseInt("10", undefined);
`,
			snapshot: `
parseInt("10", undefined);
               ~~~~~~~~~
               Invalid radix parameter; must be an integer between 2 and 36.
`,
		},
		{
			code: `
Number.parseInt("10");
`,
			snapshot: `
Number.parseInt("10");
~~~~~~~~~~~~~~~~~~~~~
This \`parseInt\` call is missing a radix parameter to specify the numeral system base.
`,
		},
		{
			code: `
Number.parseInt("10", 1);
`,
			snapshot: `
Number.parseInt("10", 1);
                      ~
                      Invalid radix parameter; must be an integer between 2 and 36.
`,
		},
		{
			code: `
parseInt();
`,
			snapshot: `
parseInt();
~~~~~~~~~~
This \`parseInt\` call is missing a radix parameter to specify the numeral system base.
`,
		},
		{
			code: `
Number.parseInt();
`,
			snapshot: `
Number.parseInt();
~~~~~~~~~~~~~~~~~
This \`parseInt\` call is missing a radix parameter to specify the numeral system base.
`,
		},
		{
			code: `
parseInt("10", -1);
`,
			snapshot: `
parseInt("10", -1);
               ~~
               Invalid radix parameter; must be an integer between 2 and 36.
`,
		},
		{
			code: `
const aliasedParseInt = parseInt;
aliasedParseInt("10");
`,
			snapshot: `
const aliasedParseInt = parseInt;
aliasedParseInt("10");
~~~~~~~~~~~~~~~~~~~~~
This \`parseInt\` call is missing a radix parameter to specify the numeral system base.
`,
		},
		{
			code: `
parseInt("10", 100);
`,
			snapshot: `
parseInt("10", 100);
               ~~~
               Invalid radix parameter; must be an integer between 2 and 36.
`,
		},
		{
			code: `
Number.parseInt("10", 0);
`,
			snapshot: `
Number.parseInt("10", 0);
                      ~
                      Invalid radix parameter; must be an integer between 2 and 36.
`,
		},
	],
	valid: [
		`parseInt("10", 10);`,
		`parseInt("10", 2);`,
		`parseInt("10", 16);`,
		`parseInt("10", 36);`,
		`Number.parseInt("10", 10);`,
		`Number.parseInt("10", 2);`,
		`parseInt("10", radix);`,
		`parseInt("10", getRadix());`,
		`const obj = { parseInt: (s: string) => 0 }; obj.parseInt("10");`,
		`function parseInt(s: string) { return 0; } parseInt("10"); export {};`,
		`const parseInt = (s: string) => 0; parseInt("10"); export {};`,
		`class Foo { parseInt(s: string) { return 0; } } new Foo().parseInt("10");`,
		`function test(Number: { parseInt: (s: string) => number }) { Number.parseInt("10"); }`,
		`parseInt("10", 8);`,
		`parseInt("10", someVariable);`,
		`parseInt("10", someObject.property);`,
		`parseInt("10", someArray[0]);`,
		`parseInt("10", 2 + 8);`,
	],
});
