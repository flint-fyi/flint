import rule from "./functionNames.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const value = function() {};
`,
			snapshot: `
const value = function() {};
              ~~~~~~~~
              Function expression should have a name.
`,
		},
		{
			code: `
array.map(function(item) { return item; });
`,
			snapshot: `
array.map(function(item) { return item; });
          ~~~~~~~~
          Function expression should have a name.
`,
		},
		{
			code: `
const object = { value: function() {} };
`,
			snapshot: `
const object = { value: function() {} };
                        ~~~~~~~~
                        Function expression should have a name.
`,
		},
		{
			code: `
(function() {})();
`,
			snapshot: `
(function() {})();
 ~~~~~~~~
 Function expression should have a name.
`,
		},
		{
			code: `
array.map(function(item) { return item; });
`,
			options: { policy: "asNeeded" },
			snapshot: `
array.map(function(item) { return item; });
          ~~~~~~~~
          Function expression should have a name.
`,
		},

		{
			code: `
const value = function named() {};
`,
			options: { policy: "never" },
			snapshot: `
const value = function named() {};
                       ~~~~~
                       Function expression should not have a name.
`,
		},
		{
			code: `
const object = { value: function named() {} };
`,
			options: { policy: "never" },
			snapshot: `
const object = { value: function named() {} };
                                 ~~~~~
                                 Function expression should not have a name.
`,
		},
	],
	valid: [
		`const value = function value() {};`,
		`const value = () => {};`,
		`function declaration() {}`,
		`const object = { value: function value() {} };`,
		`array.map(function callback(item) { return item; });`,
		{
			code: `const value = function() {};`,
			options: { policy: "asNeeded" },
		},
		{
			code: `const object = { value: function() {} };`,
			options: { policy: "asNeeded" },
		},
		{
			code: `value = function() {};`,
			options: { policy: "asNeeded" },
		},
		{
			code: `const value = function() {};`,
			options: { policy: "never" },
		},
		{
			code: `array.map(function(item) { return item; });`,
			options: { policy: "never" },
		},
	],
});
