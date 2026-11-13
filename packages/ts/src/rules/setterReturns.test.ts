import { javascriptRuleTester } from "./ruleTester.ts";
import rule from "./setterReturns.ts";

javascriptRuleTester.describe(rule, {
	invalid: [
		{
			files: {
				"file.js": `
const object = {
    set value(value) {
        return value;
    }
};
`,
			},
			snapshot: {
				"file.js": `
const object = {
    set value(value) {
        return value;
        ~~~~~~~~~~~~~
        Values returned by setters are always ignored.
    }
};
`,
			},
		},
		{
			files: {
				"file.js": `
class Example {
    set name(value) {
        return value;
    }
}
`,
			},
			snapshot: {
				"file.js": `
class Example {
    set name(value) {
        return value;
        ~~~~~~~~~~~~~
        Values returned by setters are always ignored.
    }
}
`,
			},
		},
		{
			files: {
				"file.js": `
class Example {
    #value = 0;

    set value(value) {
        if (value > 0) {
            return value;
        }
        this.#value = value;
    }
}
`,
			},
			snapshot: {
				"file.js": `
class Example {
    #value = 0;

    set value(value) {
        if (value > 0) {
            return value;
            ~~~~~~~~~~~~~
            Values returned by setters are always ignored.
        }
        this.#value = value;
    }
}
`,
			},
		},
		{
			files: {
				"file.js": `
const object = {
    set value(value) {
        return 42;
    }
};
`,
			},
			snapshot: {
				"file.js": `
const object = {
    set value(value) {
        return 42;
        ~~~~~~~~~~
        Values returned by setters are always ignored.
    }
};
`,
			},
		},
		{
			files: {
				"file.js": `
class Example {
    set "computed-name"(value) {
        return value;
    }
}
`,
			},
			snapshot: {
				"file.js": `
class Example {
    set "computed-name"(value) {
        return value;
        ~~~~~~~~~~~~~
        Values returned by setters are always ignored.
    }
}
`,
			},
		},
		{
			files: {
				"file.js": `
const key = "dynamic";
const object = {
    set [key](value) {
        return value;
    }
};
`,
			},
			snapshot: {
				"file.js": `
const key = "dynamic";
const object = {
    set [key](value) {
        return value;
        ~~~~~~~~~~~~~
        Values returned by setters are always ignored.
    }
};
`,
			},
		},
	],
	valid: [
		{
			files: {
				"file.js": `const object = { _value: 0, set value(value) { this._value = value; } };`,
			},
		},
		{
			files: {
				"file.js": `class Example { #value = 0; set value(value) { this.#value = value; } }`,
			},
		},
		{
			files: {
				"file.js": `
const object = {
    _value: 0,

    set value(value) {
        if (!value) return;
        this._value = value;
    }
};
`,
			},
		},
		{
			files: {
				"file.js": `
class Example {
    #value = 0;

    set value(value) {
        if (!value) {
            return;
        }
        this.#value = value;
    }
}
`,
			},
		},
		{
			files: {
				"file.js": `
const object = {
    _value: 0,

    get value() {
        return this._value;
    }
};
`,
			},
		},
		{
			files: {
				"file.js": `
class Example {
    #value = 0;

    get value() {
        return this.#value;
    }
}
`,
			},
		},
		{
			files: {
				"file.js": `
const object = {
    _value: 0,

    set value(value) {
        const getValue = () => value;
        this._value = getValue();
    }
};
`,
			},
		},
		{
			files: {
				"file.js": `
class Example {
    #value = 0;

    set value(value) {
        function getValue() { return value; }
        this.#value = getValue();
    }
}
`,
			},
		},
		{
			files: {
				"file.js": `
class Example {
    #value = 0;

    set value(value) {
        const getValue = function() { return value; };
        this.#value = getValue();
    }
}
`,
			},
		},
		{
			files: {
				"file.js": `class Example { set value(value) {} }`,
			},
		},
	],
});
