import { javascriptRuleTester, ruleTester } from "./ruleTester.ts";
import rule from "./variableDeletions.ts";

javascriptRuleTester.describe(rule, {
	invalid: [
		{
			files: {
				"file.js": `
delete value;
`,
			},
			snapshot: {
				"file.js": `
delete value;
~~~~~~~~~~~~
Deleting a variable with the delete operator outside of strict mode will silently fail and return false.
`,
			},
		},
	],
	valid: [],
});

ruleTester.describe(rule, {
	invalid: [],
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
