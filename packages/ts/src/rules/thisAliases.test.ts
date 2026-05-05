import { ruleTester } from "./ruleTester.ts";
import rule from "./thisAliases.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const self = this;
`,
			snapshot: `
const self = this;
      ~~~~~~~~~~~
      Assigning \`this\` to a variable is unnecessary with arrow functions.
`,
		},
		{
			code: `
let that = this;
`,
			snapshot: `
let that = this;
    ~~~~~~~~~~~
    Assigning \`this\` to a variable is unnecessary with arrow functions.
`,
		},
		{
			code: `
var me = this;
`,
			snapshot: `
var me = this;
    ~~~~~~~~~
    Assigning \`this\` to a variable is unnecessary with arrow functions.
`,
		},
		{
			code: `
class Example {
    method() {
        const instance = this;
        setTimeout(function() {
            console.log(instance);
        }, 100);
    }
}
`,
			snapshot: `
class Example {
    method() {
        const instance = this;
              ~~~~~~~~~~~~~~~
              Assigning \`this\` to a variable is unnecessary with arrow functions.
        setTimeout(function() {
            console.log(instance);
        }, 100);
    }
}
`,
		},
		{
			code: `
let ref: typeof this;
ref = this;
`,
			snapshot: `
let ref: typeof this;
ref = this;
~~~~~~~~~~
Assigning \`this\` to a variable is unnecessary with arrow functions.
`,
		},
	],
	valid: [
		`const { props, state } = this;`,
		`const [first] = this;`,
		`const result = process(this);`,
		`class Example { method() { return this; } }`,
		`const fn = () => this;`,
		`function getThis() { return this; }`,
		`this.value = 10;`,
	],
});
