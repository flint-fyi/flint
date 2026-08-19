import rule from "./getterReturns.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
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
    condition: true,
    data: 1,
    get value() {
        if (this.condition) {
            return this.data;
        }
    }
};
`,
			snapshot: `
const object = {
    condition: true,
    data: 1,
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
    items = [1];

    get value() {
        for (const item of this.items) {
            return item;
        }
    }
}
`,
			snapshot: `
class Example {
    items = [1];

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
    condition = true;
    data = 1;

    get value() {
        while (this.condition) {
            return this.data;
        }
    }
}
`,
			snapshot: `
class Example {
    condition = true;
    data = 1;

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
    type = "a";

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
    type = "a";

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
    compute() {
        return 1;
    }

    get value() {
        try {
            return this.compute();
        } catch {
            "error";
        }
    }
}
`,
			snapshot: `
class Example {
    compute() {
        return 1;
    }

    get value() {
        ~~~~~
        This getter implicitly returns \`undefined\` because it does not explicitly \`return\` a value.
        try {
            return this.compute();
        } catch {
            "error";
        }
    }
}
`,
		},
		{
			code: `
class Example {
    condition = true;
    other = false;

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
    condition = true;
    other = false;

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
		`
const object = {
    _value: 1,
    get value() {
        return this._value;
    },
};
`,
		`
class Example {
    private _value = 1;

    get value() {
        return this._value;
    }
}
`,
		`const object = { get value() { return 42; } };`,
		`
class Example {
    condition = true;
    data = 1;
    defaultValue = 2;

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
    condition = true;
    data = 1;
    defaultValue = 2;

    get value() {
        return this.condition ? this.data : this.defaultValue;
    }
}
`,
		`declare class Example { get value(): number; }`,
		`
abstract class Base {
    abstract get value(): number;
}
`,
		`
const object = {
    _value: 42,
    set value(newValue: number) {
        this._value = newValue;
    },
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
    private _value = 1;

    get value() {
        const inner = () => { return "inner"; };
        return this._value;
    }
}
`,
		`
class Example {
    condition = true;

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
    type = "a";

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
    fallback = 0;

    compute() {
        return 1;
    }

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
    private _value = 1;

    riskyOperation() {}

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
    condition = true;
    private _value = 1;

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
