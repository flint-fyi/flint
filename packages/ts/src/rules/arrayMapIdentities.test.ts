import rule from "./arrayMapIdentities.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const result = values.flatMap((value) => value);
`,
			output: `
const result = values.flat();
`,
			snapshot: `
const result = values.flatMap((value) => value);
                     ~~~~~~~~~~~~~~~~~~~~~~~~~~
                     Prefer \`.flat()\` over \`.flatMap()\` when the callback returns its argument unchanged.
`,
		},
		{
			code: `
const result = values.flatMap(value => value);
`,
			output: `
const result = values.flat();
`,
			snapshot: `
const result = values.flatMap(value => value);
                     ~~~~~~~~~~~~~~~~~~~~~~~~
                     Prefer \`.flat()\` over \`.flatMap()\` when the callback returns its argument unchanged.
`,
		},
		{
			code: `
const result = values.flatMap((item) => { return item; });
`,
			output: `
const result = values.flat();
`,
			snapshot: `
const result = values.flatMap((item) => { return item; });
                     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                     Prefer \`.flat()\` over \`.flatMap()\` when the callback returns its argument unchanged.
`,
		},
		{
			code: `
const result = values.flatMap(function (element) { return element; });
`,
			output: `
const result = values.flat();
`,
			snapshot: `
const result = values.flatMap(function (element) { return element; });
                     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                     Prefer \`.flat()\` over \`.flatMap()\` when the callback returns its argument unchanged.
`,
		},
		{
			code: `
const result = values.flatMap((value) => (value));
`,
			output: `
const result = values.flat();
`,
			snapshot: `
const result = values.flatMap((value) => (value));
                     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                     Prefer \`.flat()\` over \`.flatMap()\` when the callback returns its argument unchanged.
`,
		},
		{
			code: `
const result = values.flatMap((value) => { return (value); });
`,
			output: `
const result = values.flat();
`,
			snapshot: `
const result = values.flatMap((value) => { return (value); });
                     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                     Prefer \`.flat()\` over \`.flatMap()\` when the callback returns its argument unchanged.
`,
		},
		{
			code: `
const result = getValues().flatMap((item) => item);
`,
			output: `
const result = getValues().flat();
`,
			snapshot: `
const result = getValues().flatMap((item) => item);
                          ~~~~~~~~~~~~~~~~~~~~~~~~
                          Prefer \`.flat()\` over \`.flatMap()\` when the callback returns its argument unchanged.
`,
		},
	],
	valid: [
		`const result = values.flatMap((value) => value * 2);`,
		`const result = values.flatMap((value) => transform(value));`,
		`const result = values.flatMap((value) => [value, value]);`,
		`const result = values.flatMap((value) => other);`,
		`const result = values.flatMap((value) => { return value * 2; });`,
		`const result = values.flatMap((value) => { return other; });`,
		`const result = values.flat();`,
		`const result = values.map((value) => value);`,
		`const result = values.flatMap((a, b) => a);`,
		`const result = values.flatMap(() => value);`,
		`const result = values.flatMap(callback);`,
		`const result = values.flatMap((value) => { const x = value; return x; });`,
		`const result = values.flatMap((value) => { return; });`,
		`const result = values.flatMap();`,
		`const result = values.flatMap((value) => value, thisArg);`,
		`const result = values.flatMap(({ value }) => value);`,
		`const result = values.flatMap(function ({ value }) { return value; });`,
		`flatMap((value) => value);`,
	],
});
