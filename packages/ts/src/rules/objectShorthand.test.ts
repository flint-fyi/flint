import rule from "./objectShorthand.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const name = "Alice";
const user = { name: name };
`,
			snapshot: `
const name = "Alice";
const user = { name: name };
               ~~~~~~~~~~
               Object properties where the key matches the value identifier can use shorthand syntax.
`,
		},
		{
			code: `
const value = 42;
const settings = { value: value, other: true };
`,
			snapshot: `
const value = 42;
const settings = { value: value, other: true };
                   ~~~~~~~~~~~~
                   Object properties where the key matches the value identifier can use shorthand syntax.
`,
		},
		{
			code: `
const config = {
    handler: function() {
        return "result";
    }
};
`,
			snapshot: `
const config = {
    handler: function() {
    ~~~~~~~~~~~~~~~~~~~~~
    Function expressions in object literals can use method shorthand syntax.
        return "result";
        ~~~~~~~~~~~~~~~~
    }
    ~
};
`,
		},
		{
			code: `
declare function fetch(url: string): Promise<unknown>;

const api = {
    fetchData: function(url: string) {
        return fetch(url);
    }
};
`,
			snapshot: `
declare function fetch(url: string): Promise<unknown>;

const api = {
    fetchData: function(url: string) {
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Function expressions in object literals can use method shorthand syntax.
        return fetch(url);
        ~~~~~~~~~~~~~~~~~~
    }
    ~
};
`,
		},
		{
			code: `
const calculator = {
    add: function*(numbers: number[]) {
        for (const num of numbers) {
            yield num;
        }
    }
};
`,
			snapshot: `
const calculator = {
    add: function*(numbers: number[]) {
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Function expressions in object literals can use method shorthand syntax.
        for (const num of numbers) {
        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            yield num;
            ~~~~~~~~~~
        }
        ~
    }
    ~
};
`,
		},
		{
			code: `
const service = {
    load: async function() {
        return await Promise.resolve("data");
    }
};
`,
			snapshot: `
const service = {
    load: async function() {
    ~~~~~~~~~~~~~~~~~~~~~~~~
    Function expressions in object literals can use method shorthand syntax.
        return await Promise.resolve("data");
        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    }
    ~
};
`,
		},
		{
			code: `
declare const console: { log(value: string): void };

const handlers = {
    onClick: () => {
        console.log("clicked");
    }
};
`,
			snapshot: `
declare const console: { log(value: string): void };

const handlers = {
    onClick: () => {
    ~~~~~~~~~~~~~~~~
    Function expressions in object literals can use method shorthand syntax.
        console.log("clicked");
        ~~~~~~~~~~~~~~~~~~~~~~~
    }
    ~
};
`,
		},
		{
			code: `
const key = "value";
const obj = { [key]: key };
`,
			snapshot: `
const key = "value";
const obj = { [key]: key };
              ~~~~~~~~~~
              Object properties where the key matches the value identifier can use shorthand syntax.
`,
		},
		{
			code: `
const prop = 123;
const obj = { "prop": prop };
`,
			snapshot: `
const prop = 123;
const obj = { "prop": prop };
              ~~~~~~~~~~~~
              Object properties where the key matches the value identifier can use shorthand syntax.
`,
		},
		{
			code: `
const id = 1;
const wrapped = { id: (id) };
`,
			snapshot: `
const id = 1;
const wrapped = { id: (id) };
                  ~~~~~~~~
                  Object properties where the key matches the value identifier can use shorthand syntax.
`,
		},
		{
			code: `
const obj = {
	fn: () => {
		return 42;
	}
};
`,
			snapshot: `
const obj = {
	fn: () => {
	~~~~~~~~~~~
	Function expressions in object literals can use method shorthand syntax.
		return 42;
		~~~~~~~~~~
	}
	~
};
`,
		},
		{
			code: `
const key = "name";
const obj = { [key]: key };
`,
			snapshot: `
const key = "name";
const obj = { [key]: key };
              ~~~~~~~~~~
              Object properties where the key matches the value identifier can use shorthand syntax.
`,
		},
		{
			code: `
const key = "answer";
const computed = {
	[key]: function() {
		return 42;
	}
};
`,
			snapshot: `
const key = "answer";
const computed = {
	[key]: function() {
	~~~~~~~~~~~~~~~~~~~
	Function expressions in object literals can use method shorthand syntax.
		return 42;
		~~~~~~~~~~
	}
	~
};
`,
		},
		{
			code: `
const x = 1;
const y = 2;
const obj = { x: x, y: y };
`,
			snapshot: `
const x = 1;
const y = 2;
const obj = { x: x, y: y };
              ~~~~
              Object properties where the key matches the value identifier can use shorthand syntax.
                    ~~~~
                    Object properties where the key matches the value identifier can use shorthand syntax.
`,
		},
		{
			code: `
const name = "test";
const obj = { "name": name };
`,
			snapshot: `
const name = "test";
const obj = { "name": name };
              ~~~~~~~~~~~~
              Object properties where the key matches the value identifier can use shorthand syntax.
`,
		},
	],
	valid: [
		`const name = "Alice"; const user = { name };`,
		`const value = 42; const settings = { value, other: true };`,
		`const config = { handler() { return "result"; } };`,
		`
declare function fetch(url: string): Promise<unknown>;

const api = { async fetchData(url: string) { return fetch(url); } };`,
		`const calculator = { *add(numbers: number[]) { for (const num of numbers) { yield num; } } };`,
		`const firstName = "Alice"; const user = { name: firstName };`,
		`const count = 10; const other = 5; const data = { count: other };`,
		`const key = "dynamic"; const obj = { [key]: "static" };`,
		`
declare const console: { log(value: string): void };

const onClick = () => console.log("clicked");
const handlers = { onClick };`,
		`const handler = function namedHandler() { return true; }; const obj = { run: handler };`,
		`const obj = { process: function processor() { return "result"; } };`,
		`const events = { click: (event: { target: string }) => event.target };`,
		`
declare function fetch(url: string): Promise<unknown>;

const events = { click: async () => { await fetch("/api"); } };`,
		`
function createObject(this: { value: number }) {
	return {
		method: () => {
			return this.value;
		},
	};
}`,
		`
function createObject() {
	return {
		method: () => {
			return arguments[0];
		},
	};
}`,
		`
class Base {
	method() {
		return 0;
	}
}

class Derived extends Base {
	obj = {
		method: () => {
			return super.method();
		},
	};
}`,
		`
function createObject() {
	return {
		method: () => {
			return new.target;
		},
	};
}`,
		`
const value = 1;
const obj = { "invalid-identifier": value };`,
		`
const value = 1;
const obj = { "123": value };`,
		`const x = 1; const obj = { "x y": x };`,
		`
const obj = {
	_name: "Alice",
	get name() {
		return this._name;
	},
};`,
		`
const obj = {
	_name: "",
	set name(value: string) {
		this._name = value;
	},
};`,
		`
const obj = {
	get x() {
		return 1;
	},
	set x(value: number) {},
};`,
		`const obj = { callback: (value: number) => value };`,
		`const config = { method: async () => { return "data"; } };`,
		`
const other = { value: 1 };
const obj = { ...other };`,
		`
const first = 1;
const second = 2;
const rest = { third: 3 };
const obj = { first, second, ...rest };`,
		`
const other = { value: 1 };
const obj = { a: 1, ...other };`,
		`
const key = "value";
const value = 1;
const obj = { [key]: value };`,
		`
const key = "value";
const obj = { [key]() {} };`,
		`
const value = 1;
const obj = { getValue: () => value };`,
		`const obj = { a: function a(){} };`,
		`
const y = "y";
const z = "z";
const obj = { x: y, y: z, z: "z" };`,
	],
});
