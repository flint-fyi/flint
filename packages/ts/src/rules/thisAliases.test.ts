import { domLibRuleTester, ruleTester } from "./ruleTester.ts";
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
		`
class Example {
    props = {};
    state = {};

    method() {
        const { props, state } = this;
        return [props, state];
    }
}
`,
		`
class Example extends Array<number> {
    method() {
        const [first] = this;
        return first;
    }
}
`,
		`
declare function process(value: unknown): unknown;

const result = process(this);
`,
		`class Example { method() { return this; } }`,
		`
class Example {
    method() {
        const getInstance = () => this;
        return getInstance;
    }
}
`,
		`function getThis(this: unknown) { return this; }`,
		`
class Example {
    value = 0;

    method() {
        this.value = 10;
    }
}
`,
	],
});

domLibRuleTester.describe(rule, {
	invalid: [
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
	],
	valid: [
		`
class Example {
    method() {
        setTimeout(() => console.log(this), 100);
    }
}
`,
	],
});
