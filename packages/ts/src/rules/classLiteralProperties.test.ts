import rule from "./classLiteralProperties.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
class Example {
    get value() {
        return 'hello';
    }
}
`,
			snapshot: `
class Example {
    get value() {
    ~~~~~~~~~~~~~
    Prefer a readonly class field over a getter returning a literal value.
        return 'hello';
        ~~~~~~~~~~~~~~~
    }
    ~
}
`,
		},
		{
			code: `
class Example {
    get count() {
        return 42;
    }
}
`,
			snapshot: `
class Example {
    get count() {
    ~~~~~~~~~~~~~
    Prefer a readonly class field over a getter returning a literal value.
        return 42;
        ~~~~~~~~~~
    }
    ~
}
`,
		},
		{
			code: `
class Example {
    get enabled() {
        return true;
    }
}
`,
			snapshot: `
class Example {
    get enabled() {
    ~~~~~~~~~~~~~~~
    Prefer a readonly class field over a getter returning a literal value.
        return true;
        ~~~~~~~~~~~~
    }
    ~
}
`,
		},
		{
			code: `
class Example {
    get disabled() {
        return false;
    }
}
`,
			snapshot: `
class Example {
    get disabled() {
    ~~~~~~~~~~~~~~~~
    Prefer a readonly class field over a getter returning a literal value.
        return false;
        ~~~~~~~~~~~~~
    }
    ~
}
`,
		},
		{
			code: `
class Example {
    get data() {
        return null;
    }
}
`,
			snapshot: `
class Example {
    get data() {
    ~~~~~~~~~~~~
    Prefer a readonly class field over a getter returning a literal value.
        return null;
        ~~~~~~~~~~~~
    }
    ~
}
`,
		},
		{
			code: `
class Example {
    get negative() {
        return -1;
    }
}
`,
			snapshot: `
class Example {
    get negative() {
    ~~~~~~~~~~~~~~~~
    Prefer a readonly class field over a getter returning a literal value.
        return -1;
        ~~~~~~~~~~
    }
    ~
}
`,
		},
		{
			code: `
class Example {
    get pattern() {
        return /test/;
    }
}
`,
			snapshot: `
class Example {
    get pattern() {
    ~~~~~~~~~~~~~~~
    Prefer a readonly class field over a getter returning a literal value.
        return /test/;
        ~~~~~~~~~~~~~~
    }
    ~
}
`,
		},
		{
			code: `
class Example {
    get template() {
        return \`hello\`;
    }
}
`,
			snapshot: `
class Example {
    get template() {
    ~~~~~~~~~~~~~~~~
    Prefer a readonly class field over a getter returning a literal value.
        return \`hello\`;
        ~~~~~~~~~~~~~~~
    }
    ~
}
`,
		},
		{
			code: `
class Example {
    get bigNumber() {
        return 123n;
    }
}
`,
			snapshot: `
class Example {
    get bigNumber() {
    ~~~~~~~~~~~~~~~~~
    Prefer a readonly class field over a getter returning a literal value.
        return 123n;
        ~~~~~~~~~~~~
    }
    ~
}
`,
		},
	],
	valid: [
		`class Example { readonly value = 'hello'; }`,
		`class Example { get value() { return this.compute(); } }`,
		`class Example { get value() { return getValue(); } }`,
		`class Example { get value() { return someVariable; } }`,
		`class Example { get items() { return []; } }`,
		`class Example { get config() { return {}; } }`,
		`class Example { get fn() { return () => {}; } }`,
		`class Example { get value() { const x = 1; return x; } }`,
		`class Example { get value() { } }`,
		`class Example { get value() { return; } }`,
	],
});
