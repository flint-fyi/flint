import rule from "./getterReturns.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const object = {
    get value() {
        console.log("accessed");
    }
};
`,
			snapshot: `
const object = {
    get value() {
        ~~~~~
        This getter implicitly returns \`undefined\` because it does not explicitly \`return\` a value.
        console.log("accessed");
    }
};
`,
		},
		{
			code: `
class Example {
    get value() {
        this.compute();
    }
}
`,
			snapshot: `
class Example {
    get value() {
        ~~~~~
        This getter implicitly returns \`undefined\` because it does not explicitly \`return\` a value.
        this.compute();
    }
}
`,
		},
		{
			code: `
const object = {
    get value() {}
};
`,
			snapshot: `
const object = {
    get value() {}
        ~~~~~
        This getter implicitly returns \`undefined\` because it does not explicitly \`return\` a value.
};
`,
		},
		{
			code: `
class Example {
    get value() {
        return;
    }
}
`,
			snapshot: `
class Example {
    get value() {
        ~~~~~
        This getter implicitly returns \`undefined\` because it does not explicitly \`return\` a value.
        return;
    }
}
`,
		},
		{
			code: `
const object = {
    get value() {
        if (this.condition) {
            return this.data;
        }
    }
};
`,
			snapshot: `
const object = {
    get value() {
        ~~~~~
        This getter implicitly returns \`undefined\` because it does not explicitly \`return\` a value.
        if (this.condition) {
            return this.data;
        }
    }
};
`,
		},
		{
			code: `
class Example {
    get value() {
        const helper = () => { return 42; };
    }
}
`,
			snapshot: `
class Example {
    get value() {
        ~~~~~
        This getter implicitly returns \`undefined\` because it does not explicitly \`return\` a value.
        const helper = () => { return 42; };
    }
}
`,
		},
		{
			code: `
class Example {
    get value() {
        function inner() { return 1; }
    }
}
`,
			snapshot: `
class Example {
    get value() {
        ~~~~~
        This getter implicitly returns \`undefined\` because it does not explicitly \`return\` a value.
        function inner() { return 1; }
    }
}
`,
		},
		{
			code: `
class Example {
    get "computed-name"() {
        console.log("no return");
    }
}
`,
			snapshot: `
class Example {
    get "computed-name"() {
        ~~~~~~~~~~~~~~~
        This getter implicitly returns \`undefined\` because it does not explicitly \`return\` a value.
        console.log("no return");
    }
}
`,
		},
		{
			code: `
const key = "dynamic";
const object = {
    get [key]() {
        console.log("accessed");
    }
};
`,
			snapshot: `
const key = "dynamic";
const object = {
    get [key]() {
        ~~~~~
        This getter implicitly returns \`undefined\` because it does not explicitly \`return\` a value.
        console.log("accessed");
    }
};
`,
		},
		{
			code: `
class Example {
    get value() {
        for (const item of this.items) {
            return item;
        }
    }
}
`,
			snapshot: `
class Example {
    get value() {
        ~~~~~
        This getter implicitly returns \`undefined\` because it does not explicitly \`return\` a value.
        for (const item of this.items) {
            return item;
        }
    }
}
`,
		},
		{
			code: `
class Example {
    get value() {
        while (this.condition) {
            return this.data;
        }
    }
}
`,
			snapshot: `
class Example {
    get value() {
        ~~~~~
        This getter implicitly returns \`undefined\` because it does not explicitly \`return\` a value.
        while (this.condition) {
            return this.data;
        }
    }
}
`,
		},
		{
			code: `
class Example {
    get value() {
        switch (this.type) {
            case "a":
                return 1;
            case "b":
                return 2;
        }
    }
}
`,
			snapshot: `
class Example {
    get value() {
        ~~~~~
        This getter implicitly returns \`undefined\` because it does not explicitly \`return\` a value.
        switch (this.type) {
            case "a":
                return 1;
            case "b":
                return 2;
        }
    }
}
`,
		},
		{
			code: `
class Example {
    get value() {
        try {
            return this.compute();
        } catch {
            console.log("error");
        }
    }
}
`,
			snapshot: `
class Example {
    get value() {
        ~~~~~
        This getter implicitly returns \`undefined\` because it does not explicitly \`return\` a value.
        try {
            return this.compute();
        } catch {
            console.log("error");
        }
    }
}
`,
		},
		{
			code: `
class Example {
    get value() {
        if (this.condition) {
            return 1;
        } else if (this.other) {
            return 2;
        }
    }
}
`,
			snapshot: `
class Example {
    get value() {
        ~~~~~
        This getter implicitly returns \`undefined\` because it does not explicitly \`return\` a value.
        if (this.condition) {
            return 1;
        } else if (this.other) {
            return 2;
        }
    }
}
`,
		},
	],
	valid: [
		`const object = { get value() { return this._value; } };`,
		`class Example { get value() { return this._value; } }`,
		`const object = { get value() { return 42; } };`,
		`
class Example {
    get value() {
        if (this.condition) {
            return this.data;
        }
        return this.defaultValue;
    }
}
`,
		`
class Example {
    get value() {
        return this.condition ? this.data : this.defaultValue;
    }
}
`,
		`class Example { get value(): number; }`,
		`
abstract class Base {
    abstract get value(): number;
}
`,
		`
const object = {
    value: 42,
    set value(newValue: number) {
        console.log("set", newValue);
    }
};
`,
		`
class Example {
    private _value = 0;
    set value(newValue: number) {
        this._value = newValue;
    }
}
`,
		`
class Example {
    get value() {
        const inner = () => { console.log("inner"); };
        return this._value;
    }
}
`,
		`
class Example {
    get value() {
        if (this.condition) {
            return 1;
        } else {
            return 2;
        }
    }
}
`,
		`
class Example {
    get value() {
        switch (this.type) {
            case "a":
                return 1;
            case "b":
                return 2;
            default:
                return 3;
        }
    }
}
`,
		`
class Example {
    get value() {
        try {
            return this.compute();
        } catch {
            return this.fallback;
        }
    }
}
`,
		`
class Example {
    get value() {
        try {
            this.riskyOperation();
        } finally {
            return this._value;
        }
    }
}
`,
		`
class Example {
    get value() {
        throw new Error("Not implemented");
    }
}
`,
		`
class Example {
    get value() {
        if (this.condition) {
            throw new Error("Invalid");
        }
        return this._value;
    }
}
`,
	],
});
