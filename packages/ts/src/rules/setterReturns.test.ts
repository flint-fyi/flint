import { createRuleTesterTSConfig } from "@flint.fyi/typescript-language";

import { ruleTester } from "./ruleTester.ts";
import rule from "./setterReturns.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const object = {
    set value(value) {
        return value;
    }
};
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
			snapshot: `
const object = {
    set value(value) {
        return value;
        ~~~~~~~~~~~~~
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
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
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
    #value = 0;

    set value(value) {
        if (value > 0) {
            return value;
        }
        this.#value = value;
    }
}
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
			snapshot: `
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
		{
			code: `
const object = {
    set value(value) {
        return 42;
    }
};
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
			snapshot: `
const object = {
    set value(value) {
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
    set "computed-name"(value) {
        return value;
    }
}
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
			snapshot: `
class Example {
    set "computed-name"(value) {
        return value;
        ~~~~~~~~~~~~~
        Values returned by setters are always ignored.
    }
}
`,
		},
		{
			code: `
const key = "dynamic";
const object = {
    set [key](value) {
        return value;
    }
};
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
			snapshot: `
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
	],
	valid: [
		{
			code: `const object = { _value: 0, set value(value) { this._value = value; } };`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
		},
		{
			code: `class Example { #value = 0; set value(value) { this.#value = value; } }`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
		},
		{
			code: `
const object = {
    _value: 0,

    set value(value) {
        if (!value) return;
        this._value = value;
    }
};
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
		},
		{
			code: `
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
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
		},
		{
			code: `
const object = {
    _value: 0,

    get value() {
        return this._value;
    }
};
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
		},
		{
			code: `
class Example {
    #value = 0;

    get value() {
        return this.#value;
    }
}
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
		},
		{
			code: `
const object = {
    _value: 0,

    set value(value) {
        const getValue = () => value;
        this._value = getValue();
    }
};
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
		},
		{
			code: `
class Example {
    #value = 0;

    set value(value) {
        function getValue() { return value; }
        this.#value = getValue();
    }
}
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
		},
		{
			code: `
class Example {
    #value = 0;

    set value(value) {
        const getValue = function() { return value; };
        this.#value = getValue();
    }
}
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
		},
		{
			code: `class Example { set value(value) {} }`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
		},
	],
});
