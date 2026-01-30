import { ruleTester } from "./ruleTester.ts";
import rule from "./setterReturns.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const object = {
    set value(val) {
        return val;
    }
};
`,
			snapshot: `
const object = {
    set value(val) {
        return val;
        ~~~~~~~~~~~
        Values returned by setters are always ignored.
    }
};
`,
		},
		{
			code: `
class Example {
    set name(value) {
        return value;
    }
}
`,
			snapshot: `
class Example {
    set name(value) {
        return value;
        ~~~~~~~~~~~~~
        Values returned by setters are always ignored.
    }
}
`,
		},
		{
			code: `
class Example {
    set value(val) {
        if (val > 0) {
            return val;
        }
        this._value = val;
    }
}
`,
			snapshot: `
class Example {
    set value(val) {
        if (val > 0) {
            return val;
            ~~~~~~~~~~~
            Values returned by setters are always ignored.
        }
        this._value = val;
    }
}
`,
		},
		{
			code: `
const object = {
    set value(val) {
        return 42;
    }
};
`,
			snapshot: `
const object = {
    set value(val) {
        return 42;
        ~~~~~~~~~~
        Values returned by setters are always ignored.
    }
};
`,
		},
		{
			code: `
class Example {
    set "computed-name"(val) {
        return val;
    }
}
`,
			snapshot: `
class Example {
    set "computed-name"(val) {
        return val;
        ~~~~~~~~~~~
        Values returned by setters are always ignored.
    }
}
`,
		},
		{
			code: `
const key = "dynamic";
const object = {
    set [key](val) {
        return val;
    }
};
`,
			snapshot: `
const key = "dynamic";
const object = {
    set [key](val) {
        return val;
        ~~~~~~~~~~~
        Values returned by setters are always ignored.
    }
};
`,
		},
	],
	valid: [
		`const object = { set value(val) { this._value = val; } };`,
		`class Example { set value(val) { this._value = val; } }`,
		`
const object = {
    set value(val) {
        if (!val) return;
        this._value = val;
    }
};
`,
		`
class Example {
    set value(val) {
        if (!val) {
            return;
        }
        this._value = val;
    }
}
`,
		`
const object = {
    get value() {
        return this._value;
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
const object = {
    set value(val) {
        const fn = () => val;
        this._value = fn();
    }
};
`,
		`
class Example {
    set value(val) {
        function inner() { return val; }
        this._value = inner();
    }
}
`,
		`
class Example {
    set value(val) {
        const callback = function() { return val; };
        this._value = callback();
    }
}
`,
		`class Example { set value(val: number); }`,
	],
});
