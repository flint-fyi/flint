import rule from "./exportFromImports.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import defaultExport from './foo.js';
export default defaultExport;
`,
			snapshot: `
import defaultExport from './foo.js';
export default defaultExport;
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`export { default } from './foo.js'\` instead of separate import and export default.
`,
		},
		{
			code: `
import { named } from './foo.js';
export { named };
`,
			snapshot: `
import { named } from './foo.js';
export { named };
         ~~~~~
         Prefer \`export { named } from './foo.js'\` instead of separate import and export.
`,
		},
		{
			code: `
import * as namespace from './foo.js';
export { namespace };
`,
			snapshot: `
import * as namespace from './foo.js';
export { namespace };
         ~~~~~~~~~
         Prefer \`export * as namespace from './foo.js'\` instead of separate import and export.
`,
		},
		{
			code: `
import { foo, bar } from './module.js';
export { foo, bar };
`,
			snapshot: `
import { foo, bar } from './module.js';
export { foo, bar };
         ~~~
         Prefer \`export { foo } from './module.js'\` instead of separate import and export.
              ~~~
              Prefer \`export { bar } from './module.js'\` instead of separate import and export.
`,
		},
		{
			code: `
import { original as renamed } from './module.js';
export { renamed };
`,
			snapshot: `
import { original as renamed } from './module.js';
export { renamed };
         ~~~~~~~
         Prefer \`export { renamed } from './module.js'\` instead of separate import and export.
`,
		},
	],
	valid: [
		`export { named } from './foo.js';`,
		`export { default } from './foo.js';`,
		`export * as namespace from './foo.js';`,
		`import { named } from './foo.js';
const x = named();`,
		`import { named } from './foo.js';
console.log(named);`,
		`const foo = 1;
export { foo };`,
	],
});
