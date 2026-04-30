import rule from "./accessorThisRecursion.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const obj = {
    get value() {
        return this.value;
    }
};
`,
			snapshot: `
const obj = {
    get value() {
        return this.value;
               ~~~~~~~~~~
               This getter recursively accesses its own property via \`this\`, causing infinite recursion.
    }
};
`,
		},
		{
			code: `
const obj = {
    set value(newValue) {
        this.value = newValue;
    }
};
`,
			snapshot: `
const obj = {
    set value(newValue) {
        this.value = newValue;
        ~~~~~~~~~~
        This setter recursively assigns to its own property via \`this\`, causing infinite recursion.
    }
};
`,
		},
		{
			code: `
class Example {
    get name() {
        return this.name;
    }
}
`,
			snapshot: `
class Example {
    get name() {
        return this.name;
               ~~~~~~~~~
               This getter recursively accesses its own property via \`this\`, causing infinite recursion.
    }
}
`,
		},
		{
			code: `
class Example {
    set name(value: string) {
        this.name = value;
    }
}
`,
			snapshot: `
class Example {
    set name(value: string) {
        this.name = value;
        ~~~~~~~~~
        This setter recursively assigns to its own property via \`this\`, causing infinite recursion.
    }
}
`,
		},
		{
			code: `
class Example {
    get count() {
        if (condition) {
            return this.count;
        }
        return 0;
    }
}
`,
			snapshot: `
class Example {
    get count() {
        if (condition) {
            return this.count;
                   ~~~~~~~~~~
                   This getter recursively accesses its own property via \`this\`, causing infinite recursion.
        }
        return 0;
    }
}
`,
		},
	],
	valid: [
		`const obj = { get value() { return this._value; } };`,
		`const obj = { set value(v) { this._value = v; } };`,
		`class Example { private _name: string; get name() { return this._name; } }`,
		`class Example { private _name: string; set name(v: string) { this._name = v; } }`,
		`class Example { get name() { return this.otherProperty; } }`,
		`class Example { set name(v: string) { this.otherProperty = v; } }`,
		`class Example { get name() { const fn = () => this.name; return ""; } }`,
		`const obj = { get value() { return otherObj.value; } };`,
		`class Example { get name() { return super.name; } }`,
	],
});
