import rule from "./emptyDocuments.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
---
`,
			output: ``,
			snapshot: `
---
~~~
This YAML document contains no content beyond document markers.
`,
		},
		{
			code: `
---
...
`,
			output: ``,
			snapshot: `
---
~~~
This YAML document contains no content beyond document markers.
...
`,
		},
		{
			code: `
---

---
key: value
`,
			output: `
---
key: value
`,
			snapshot: `
---
~~~
This YAML document contains no content beyond document markers.

---
key: value
`,
		},
		{
			code: `
---
key: value
---
`,
			output: `
---
key: value
`,
			snapshot: `
---
key: value
---
~~~
This YAML document contains no content beyond document markers.
`,
		},
		{
			code: `
---
key1: value1
---
---
key2: value2
`,
			output: `
---
key1: value1
---
key2: value2
`,
			snapshot: `
---
key1: value1
---
~~~
This YAML document contains no content beyond document markers.
---
key2: value2
`,
		},
		{
			code: `
---
...
---
key: value
`,
			output: `
---
key: value
`,
			snapshot: `
---
~~~
This YAML document contains no content beyond document markers.
...
---
key: value
`,
		},
	],
	valid: [
		`key: value`,
		`---
key: value`,
		`# just a comment
key: value`,
		`---
key: value
---
another: value`,
		`---
key: value
...`,
	],
});
