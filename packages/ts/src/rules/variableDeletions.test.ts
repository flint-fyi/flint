import { createRuleTesterTSConfig } from "@flint.fyi/typescript-language";

import { ruleTester } from "./ruleTester.ts";
import rule from "./variableDeletions.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
delete value;
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
				noUnusedLocals: false,
			}),
			snapshot: `
delete value;
~~~~~~~~~~~~
Deleting a variable with the delete operator outside of strict mode will silently fail and return false.
`,
		},
	],
	valid: [
		`const obj: { prop?: number } = { prop: 1 }; delete obj.prop;`,
		`
declare const obj: { property?: number };

delete obj.property;
`,
		`
declare const obj: { property?: number };

delete obj["property"];
`,
		`const obj: { nested: { prop?: number } } = { nested: { prop: 1 } }; delete obj.nested.prop;`,
		`const array = [1, 2, 3]; delete array[0];`,
	],
});
