import rule from "./functionNameMatches.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const value = function other() {};
`,
			snapshot: `
const value = function other() {};
                       ~~~~~
                       Function name \`other\` does not match assigned name \`value\`.
`,
		},
		{
			code: `
let value = function other() {};
`,
			snapshot: `
let value = function other() {};
                     ~~~~~
                     Function name \`other\` does not match assigned name \`value\`.
`,
		},
		{
			code: `
const object = { value: function other() {} };
`,
			snapshot: `
const object = { value: function other() {} };
                                 ~~~~~
                                 Function name \`other\` does not match assigned name \`value\`.
`,
		},
		{
			code: `
const object = { "value": function other() {} };
`,
			snapshot: `
const object = { "value": function other() {} };
                                   ~~~~~
                                   Function name \`other\` does not match assigned name \`value\`.
`,
		},
		{
			code: `
class Example {
    value = function other() {};
}
`,
			snapshot: `
class Example {
    value = function other() {};
                     ~~~~~
                     Function name \`other\` does not match assigned name \`value\`.
}
`,
		},
	],
	valid: [
		`const value = function value() {};`,
		`const value = function() {};`,
		`const value = () => {};`,
		`let value = function value() {};`,
		`const object = { value: function value() {} };`,
		`const object = { value: function() {} };`,
		`const object = { "value": function value() {} };`,
		`const object = { [computed]: function value() {} };`,
		`const object = { "foo//bar": function value() {} };`,
		`const [value] = [function other() {}];`,
		`
class Example {
    value = function value() {};
}`,
		`
class Example {
    value = function() {};
}`,
		`
class Example {
    #value = function other() {};
}`,
	],
});
