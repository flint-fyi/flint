import rule from "./namedDefaultExports.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
export default function () {}
`,
			snapshot: `
export default function () {}
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Default exported function should have a name.
`,
		},
		{
			code: `
export default function () {
    return "value";
}
`,
			snapshot: `
export default function () {
~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Default exported function should have a name.
    return "value";
    ~~~~~~~~~~~~~~~
}
~
`,
		},
		{
			code: `
export default () => {};
`,
			snapshot: `
export default () => {};
               ~~~~~~~~
               Default exported function should have a name.
`,
		},
		{
			code: `
export default () => {
    return "value";
};
`,
			snapshot: `
export default () => {
               ~~~~~~~
               Default exported function should have a name.
    return "value";
    ~~~~~~~~~~~~~~~
};
~
`,
		},
		{
			code: `
export default async () => {};
`,
			snapshot: `
export default async () => {};
               ~~~~~~~~~~~~~~
               Default exported function should have a name.
`,
		},
		{
			code: `
export default class {}
`,
			snapshot: `
export default class {}
~~~~~~~~~~~~~~~~~~~~~~~
Default exported class should have a name.
`,
		},
		{
			code: `
export default class {
    getValue() {
        return 42;
    }
}
`,
			snapshot: `
export default class {
~~~~~~~~~~~~~~~~~~~~~~
Default exported class should have a name.
    getValue() {
    ~~~~~~~~~~~~
        return 42;
        ~~~~~~~~~~
    }
    ~
}
~
`,
		},
	],
	valid: [
		`export default function getValue() {}`,
		`export default function getValue() { return 42; }`,
		`export default async function fetchData() {}`,
		`export default class Container {}`,
		`export default class Container { getValue() { return 42; } }`,
		`const getValue = () => {}; export default getValue;`,
		`const value = 42; export default value;`,
		`export default "literal";`,
		`export default 42;`,
		`export default { key: "value" };`,
		`export default ["item"];`,
		`export = function () {};`,
		`export = class {};`,
		`export = function named() {};`,
		`export = class Named {};`,
	],
});
