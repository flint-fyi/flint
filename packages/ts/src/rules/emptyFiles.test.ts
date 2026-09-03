import rule from "./emptyFiles.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
// just a comment
`,

			snapshot: `

This file contains no meaningful code.
// just a comment
`,
		},
		{
			code: `
/* multi-line
comment */
`,
			snapshot: `

This file contains no meaningful code.
/* multi-line
comment */
`,
		},
		{
			code: `
"use strict";
`,
			snapshot: `

This file contains no meaningful code.
"use strict";
`,
		},
		{
			code: `
'use strict';
`,
			snapshot: `

This file contains no meaningful code.
'use strict';
`,
		},
		{
			code: `
"use asm";
`,
			snapshot: `

This file contains no meaningful code.
"use asm";
`,
		},
		{
			code: `
;
`,
			snapshot: `

This file contains no meaningful code.
;
`,
		},
		{
			code: `
;;;
`,
			snapshot: `

This file contains no meaningful code.
;;;
`,
		},
		{
			code: `
{}
`,
			snapshot: `

This file contains no meaningful code.
{}
`,
		},
		{
			code: `
// Comment
"use strict";
;
`,
			snapshot: `

This file contains no meaningful code.
// Comment
"use strict";
;
`,
		},
	],
	valid: [
		`const x = 1;`,
		`export const x = 1;`,
		{
			code: `import { x } from "module";`,
			files: {
				"node_modules/module/index.d.ts": `
export const x: unknown;
`,
			},
		},
		`function getValue() { return 42; }`,
		`class MyClass {}`,
		`export {};`,
		`type MyType = string;`,
		`interface MyInterface {}`,
		`enum MyEnum { A, B }`,
		`declare const x: number;`,
		`// Comment with code
const x = 1;`,
		`"use strict";
const x = 1;`,
	],
});
