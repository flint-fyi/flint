import rule from "./emptyFiles.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `// just a comment
`,
			snapshot: `// just a comment

This file contains no meaningful code.
`,
		},
		{
			code: `/* multi-line
comment */
`,
			snapshot: `/* multi-line

This file contains no meaningful code.
comment */
`,
		},
		{
			code: `"use strict";
`,
			snapshot: `"use strict";

This file contains no meaningful code.
`,
		},
		{
			code: `'use strict';
`,
			snapshot: `'use strict';

This file contains no meaningful code.
`,
		},
		{
			code: `"use asm";
`,
			snapshot: `"use asm";

This file contains no meaningful code.
`,
		},
		{
			code: `;
`,
			snapshot: `;

This file contains no meaningful code.
`,
		},
		{
			code: `;;;
`,
			snapshot: `;;;

This file contains no meaningful code.
`,
		},
		{
			code: `{}
`,
			snapshot: `{}

This file contains no meaningful code.
`,
		},
		{
			code: `// Comment
"use strict";
;
`,
			snapshot: `// Comment

This file contains no meaningful code.
"use strict";
;
`,
		},
	],
	valid: [
		`const x = 1;`,
		`export const x = 1;`,
		`import { x } from "module";`,
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
