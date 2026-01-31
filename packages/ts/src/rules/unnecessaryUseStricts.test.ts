import { ruleTester } from "./ruleTester.ts";
import rule from "./unnecessaryUseStricts.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
"use strict";

export function foo() {
    return 42;
}
`,
			output: `
export function foo() {
    return 42;
}
`,
			snapshot: `
"use strict";
~~~~~~~~~~~~~
Unnecessary "use strict" directive.

export function foo() {
    return 42;
}
`,
		},
		{
			code: `
'use strict';

export const value = 10;
`,
			output: `
export const value = 10;
`,
			snapshot: `
'use strict';
~~~~~~~~~~~~~
Unnecessary "use strict" directive.

export const value = 10;
`,
		},
		{
			code: `
"use strict";

import { something } from "./module";
`,
			output: `
import { something } from "./module";
`,
			snapshot: `
"use strict";
~~~~~~~~~~~~~
Unnecessary "use strict" directive.

import { something } from "./module";
`,
		},
		{
			code: `
"use strict";

export default class MyClass {}
`,
			output: `
export default class MyClass {}
`,
			snapshot: `
"use strict";
~~~~~~~~~~~~~
Unnecessary "use strict" directive.

export default class MyClass {}
`,
		},
		{
			code: `
"use strict";
export {};
`,
			output: `
export {};
`,
			snapshot: `
"use strict";
~~~~~~~~~~~~~
Unnecessary "use strict" directive.
export {};
`,
		},
		{
			code: `"use strict";
export const value = 42;`,
			output: `export const value = 42;`,
			snapshot: `"use strict";
~~~~~~~~~~~~~
Unnecessary "use strict" directive.
export const value = 42;`,
		},
	],
	valid: [
		`
function foo() {
    return 42;
}
`,
		`
const value = 10;
`,
		`
// No imports or exports means not a module
"use strict";

function foo() {
    return 42;
}
`,
		`
// Comments don't make it a module
"use strict";

// Some comment
console.log("hello");
`,
	],
});
