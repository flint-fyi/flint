import rule from "./functionExpressionNames.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const values = [function(item) { return item; }];
`,
			snapshot: `
const values = [function(item) { return item; }];
                ~~~~~~~~
                Function expressions without names are harder to debug.
`,
		},
		{
			code: `
array.map(function(item) { return item; });
`,
			snapshot: `
array.map(function(item) { return item; });
          ~~~~~~~~
          Function expressions without names are harder to debug.
`,
		},
		{
			code: `
(function() {})();
`,
			snapshot: `
(function() {})();
 ~~~~~~~~
 Function expressions without names are harder to debug.
`,
		},
	],
	valid: [
		`const value = function value() {};`,
		`const value = () => {};`,
		`function declaration() {}`,
		`const object = { value: function() {} };`,
		`const object = { value: function value() {} };`,
		`array.map(function callback(item) { return item; });`,
	],
});
