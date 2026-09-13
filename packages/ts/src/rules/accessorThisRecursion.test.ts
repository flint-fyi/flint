import rule from "./accessorThisRecursion.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const obj = {
    get value(): number {
        return this.value;
    }
};
`,
			snapshot: `
const obj = {
    get value(): number {
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
    set value(newValue: number) {
        this.value = newValue;
    }
};
`,
			snapshot: `
const obj = {
    set value(newValue: number) {
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
    get name(): string {
        return this.name;
    }
}
`,
			snapshot: `
class Example {
    get name(): string {
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
declare const condition: boolean;

class Example {
    get count(): number {
        if (condition) {
            return this.count;
        }
        return 0;
    }
}
`,
			snapshot: `
declare const condition: boolean;

class Example {
    get count(): number {
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
		`const obj = { _value: 0, get value() { return this._value; } };`,
		`const obj = { _value: 0, set value(value: number) { this._value = value; } };`,
		`class Example { private _name = ""; get name() { return this._name; } }`,
		`class Example { private _name = ""; set name(value: string) { this._name = value; } }`,
		`class Example { otherProperty = ""; get name() { return this.otherProperty; } }`,
		`class Example { otherProperty = ""; set name(value: string) { this.otherProperty = value; } }`,
		`class Example { get name() { const fn = () => this.name; return ""; } }`,
		`
class Example {
    get name(): string {
        class Inner {
            name = "";
            other = this.name;
        }
        return new Inner().other;
    }
}
`,
		`
declare const otherObj: { value: number };

const obj = { get value() { return otherObj.value; } };
`,
		`
class Base {
    get name() {
        return "";
    }
}

class Example extends Base {
    get name() {
        return super.name;
    }
}
`,
	],
});
