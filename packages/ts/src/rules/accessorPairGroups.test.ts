import rule from "./accessorPairGroups.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
class Example {
    get value() {
        return this._value;
    }
    otherMethod() {}
    set value(newValue: number) {
        this._value = newValue;
    }
}
`,
			snapshot: `
class Example {
    get value() {
        return this._value;
    }
    otherMethod() {}
    set value(newValue: number) {
        ~~~~~
        Getter and setter for \`value\` should be defined adjacent to each other.
        this._value = newValue;
    }
}
`,
		},
		{
			code: `
const object = {
    get value() {
        return this._value;
    },
    other: 42,
    set value(newValue: number) {}
};
`,
			snapshot: `
const object = {
    get value() {
        return this._value;
    },
    other: 42,
    set value(newValue: number) {}
        ~~~~~
        Getter and setter for \`value\` should be defined adjacent to each other.
};
`,
		},
		{
			code: `
class Example {
    set first(value: number) {
        this._first = value;
    }
    get second() {
        return this._second;
    }
    get first() {
        return this._first;
    }
    set second(value: number) {
        this._second = value;
    }
}
`,
			snapshot: `
class Example {
    set first(value: number) {
        this._first = value;
    }
    get second() {
        return this._second;
    }
    get first() {
        ~~~~~
        Getter and setter for \`first\` should be defined adjacent to each other.
        return this._first;
    }
    set second(value: number) {
        ~~~~~~
        Getter and setter for \`second\` should be defined adjacent to each other.
        this._second = value;
    }
}
`,
		},
		{
			code: `
class Example {
    private _value = 0;
    get value() {
        return this._value;
    }
    private _other = 0;
    set value(newValue: number) {
        this._value = newValue;
    }
}
`,
			snapshot: `
class Example {
    private _value = 0;
    get value() {
        return this._value;
    }
    private _other = 0;
    set value(newValue: number) {
        ~~~~~
        Getter and setter for \`value\` should be defined adjacent to each other.
        this._value = newValue;
    }
}
`,
		},
	],
	valid: [
		`
class Example {
    get value() {
        return this._value;
    }
    set value(newValue: number) {
        this._value = newValue;
    }
}
`,
		`
class Example {
    set value(newValue: number) {
        this._value = newValue;
    }
    get value() {
        return this._value;
    }
}
`,
		`
const object = {
    get value() {
        return this._value;
    },
    set value(newValue: number) {
        this._value = newValue;
    }
};
`,
		`
class Example {
    get value() {
        return this._value;
    }
}
`,
		`
class Example {
    set value(newValue: number) {
        this._value = newValue;
    }
}
`,
		`
class Example {
    get first() { return 1; }
    set first(value: number) {}
    get second() { return 2; }
    set second(value: number) {}
}
`,
	],
});
