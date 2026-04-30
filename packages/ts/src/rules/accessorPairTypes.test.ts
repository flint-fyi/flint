import rule from "./accessorPairTypes.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
class Example {
    get value(): string {
        return this._value;
    }
    set value(newValue: number) {
        this._value = String(newValue);
    }
}
`,
			snapshot: `
class Example {
    get value(): string {
        ~~~~~
        A getter's return type should be assignable to its corresponding setter's parameter type.
        return this._value;
    }
    set value(newValue: number) {
        this._value = String(newValue);
    }
}
`,
		},
		{
			code: `
const object = {
    get value(): boolean {
        return true;
    },
    set value(newValue: string) {}
};
`,
			snapshot: `
const object = {
    get value(): boolean {
        ~~~~~
        A getter's return type should be assignable to its corresponding setter's parameter type.
        return true;
    },
    set value(newValue: string) {}
};
`,
		},
		{
			code: `
interface Example {
    get value(): string;
    set value(newValue: number);
}
`,
			snapshot: `
interface Example {
    get value(): string;
        ~~~~~
        A getter's return type should be assignable to its corresponding setter's parameter type.
    set value(newValue: number);
}
`,
		},
		{
			code: `
type Example = {
    get value(): string;
    set value(newValue: number);
};
`,
			snapshot: `
type Example = {
    get value(): string;
        ~~~~~
        A getter's return type should be assignable to its corresponding setter's parameter type.
    set value(newValue: number);
};
`,
		},
		{
			code: `
class Example {
    get value(): string | number {
        return this._value;
    }
    set value(newValue: string) {
        this._value = newValue;
    }
}
`,
			snapshot: `
class Example {
    get value(): string | number {
        ~~~~~
        A getter's return type should be assignable to its corresponding setter's parameter type.
        return this._value;
    }
    set value(newValue: string) {
        this._value = newValue;
    }
}
`,
		},
	],
	valid: [
		`
class Example {
    get value(): string {
        return this._value;
    }
    set value(newValue: string) {
        this._value = newValue;
    }
}
`,
		`
class Example {
    get value(): string {
        return this._value;
    }
    set value(newValue: string | number) {
        this._value = String(newValue);
    }
}
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
    set value(newValue: string) {
        this._value = newValue;
    }
}
`,
		`
const object = {
    get value(): number {
        return 42;
    },
    set value(newValue: number) {
        console.log(newValue);
    }
};
`,
		`
interface Example {
    get value(): string;
    set value(newValue: string);
}
`,
		`
type Example = {
    get value(): number;
    set value(newValue: number);
};
`,
		`
class Example {
    get first(): string {
        return this._first;
    }
    set first(value: string) {
        this._first = value;
    }
    get second(): number {
        return this._second;
    }
    set second(value: number) {
        this._second = value;
    }
}
`,
	],
});
