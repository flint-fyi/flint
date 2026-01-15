import { ruleTester } from "./ruleTester.ts";
import rule from "./stringMappingKeys.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
123: value
`,
			snapshot: `
123: value
~~~
Mapping keys should be strings.
`,
		},
		{
			code: `
true: value
`,
			snapshot: `
true: value
~~~~
Mapping keys should be strings.
`,
		},
		{
			code: `
false: value
`,
			snapshot: `
false: value
~~~~~
Mapping keys should be strings.
`,
		},
		{
			code: `
null: value
`,
			snapshot: `
null: value
~~~~
Mapping keys should be strings.
`,
		},
		{
			code: `
[1, 2]: value
`,
			snapshot: `
[1, 2]: value
~~~~~~
Mapping keys should be strings.
`,
		},
		{
			code: `
{a: b}: value
`,
			snapshot: `
{a: b}: value
~~~~~~
Mapping keys should be strings.
`,
		},
		{
			code: `
3.14: value
`,
			snapshot: `
3.14: value
~~~~
Mapping keys should be strings.
`,
		},
	],
	valid: [
		`a: b`,
		`"123": value`,
		`'true': value`,
		`key: value`,
		`"key with spaces": value`,
		`nested:
  key: value`,
	],
});
