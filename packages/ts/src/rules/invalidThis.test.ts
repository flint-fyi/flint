import rule from "./invalidThis.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
function getValue() {
    return this.value;
}
`,
			snapshot: `
function getValue() {
    return this.value;
           ~~~~
           Unexpected \`this\` in a context where its value is \`undefined\`.
}
`,
		},
		{
			code: `
const getValue = function() {
    return this.value;
};
`,
			snapshot: `
const getValue = function() {
    return this.value;
           ~~~~
           Unexpected \`this\` in a context where its value is \`undefined\`.
};
`,
		},
		{
			code: `
(function() {
    console.log(this);
})();
`,
			snapshot: `
(function() {
    console.log(this);
                ~~~~
                Unexpected \`this\` in a context where its value is \`undefined\`.
})();
`,
		},
		{
			code: `
function outer() {
    return function inner() {
        return this.value;
    };
}
`,
			snapshot: `
function outer() {
    return function inner() {
        return this.value;
               ~~~~
               Unexpected \`this\` in a context where its value is \`undefined\`.
    };
}
`,
		},
		{
			code: `
const obj = {
    method() {
        return function() {
            return this.value;
        };
    }
};
`,
			snapshot: `
const obj = {
    method() {
        return function() {
            return this.value;
                   ~~~~
                   Unexpected \`this\` in a context where its value is \`undefined\`.
        };
    }
};
`,
		},
		{
			code: `
function getValue() {
    const arrow = () => this.value;
    return arrow();
}
`,
			snapshot: `
function getValue() {
    const arrow = () => this.value;
                        ~~~~
                        Unexpected \`this\` in a context where its value is \`undefined\`.
    return arrow();
}
`,
		},
		{
			code: `
items.forEach(function(item: unknown) {
    this.process(item);
});
`,
			snapshot: `
items.forEach(function(item: unknown) {
    this.process(item);
    ~~~~
    Unexpected \`this\` in a context where its value is \`undefined\`.
});
`,
		},
		{
			code: `
function Foo() {
    this.value = 1;
}
`,
			options: { capIsConstructor: false },
			snapshot: `
function Foo() {
    this.value = 1;
    ~~~~
    Unexpected \`this\` in a context where its value is \`undefined\`.
}
`,
		},
		{
			code: `
const Handler = function() {
    this.active = true;
};
`,
			options: { capIsConstructor: false },
			snapshot: `
const Handler = function() {
    this.active = true;
    ~~~~
    Unexpected \`this\` in a context where its value is \`undefined\`.
};
`,
		},
	],
	valid: [
		`class Example { method() { return this.value; } }`,
		`class Example { get value() { return this._value; } }`,
		`class Example { set value(v: number) { this._value = v; } }`,
		`class Example { constructor() { this.value = 0; } }`,
		`class Example { static method() { return this.name; } }`,
		`class Example { static { this.initialized = true; } }`,
		`class Example { value = this.compute(); }`,
		`class Example { static value = this.compute(); }`,
		`class Example { handler = () => this.value; }`,
		`class Example { method() { return () => this.value; } }`,
		`const obj = { method() { return this.value; } };`,
		`const obj = { get value() { return this._value; } };`,
		`const obj = { set value(v: number) { this._value = v; } };`,
		`const obj = { handler: function() { return this.value; } };`,
		`const obj = { nested: { method() { return this.value; } } };`,
		`function Foo() { this.value = 0; }`,
		`const Handler = function() { this.active = true; };`,
		`const bar = (function() { this.value = 0; }).bind(obj);`,
		`getValue.call(obj);`,
		`getValue.apply(obj, []);`,
		`items.forEach(function(item: unknown) { this.process(item); }, thisArg);`,
		`items.map(function(item: unknown) { return this.transform(item); }, context);`,
		`items.filter(function(item: unknown) { return this.matches(item); }, predicate);`,
		`items.find(function(item: unknown) { return this.equals(item); }, target);`,
		`items.some(function(item: unknown) { return this.contains(item); }, checker);`,
		`items.every(function(item: unknown) { return this.validates(item); }, validator);`,
		`obj.method = function() { return this.value; };`,
		`Foo.prototype.getValue = function() { return this.value; };`,
		`this.value = 0;`,
		{
			code: `function Foo() { this.value = 0; }`,
			options: { capIsConstructor: true },
		},
		{
			code: `const Handler = function() { this.active = true; };`,
			options: { capIsConstructor: true },
		},
	],
});
