import rule from "./objectAssignSpreads.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const source = {};
Object.assign({}, source)
`,
			snapshot: `
const source = {};
Object.assign({}, source)
~~~~~~~~~~~~~~~~~~~~~~~~~
\`Object.assign()\` with an object literal as the first argument can be replaced with object spread syntax.
`,
		},
		{
			code: `
Object.assign({}, { name: 'test' })
`,
			snapshot: `
Object.assign({}, { name: 'test' })
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
\`Object.assign()\` with an object literal as the first argument can be replaced with object spread syntax.
`,
		},
		{
			code: `
const defaults = {};
const userConfig = {};
Object.assign({}, defaults, userConfig)
`,
			snapshot: `
const defaults = {};
const userConfig = {};
Object.assign({}, defaults, userConfig)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
\`Object.assign()\` with an object literal as the first argument can be replaced with object spread syntax.
`,
		},
		{
			code: `
const data = {};
Object.assign({ id: 1 }, data)
`,
			snapshot: `
const data = {};
Object.assign({ id: 1 }, data)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
\`Object.assign()\` with an object literal as the first argument can be replaced with object spread syntax.
`,
		},
		{
			code: `
const overrides = {};
const extra = {};
Object.assign({ name: 'default', active: true }, overrides, extra)
`,
			snapshot: `
const overrides = {};
const extra = {};
Object.assign({ name: 'default', active: true }, overrides, extra)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
\`Object.assign()\` with an object literal as the first argument can be replaced with object spread syntax.
`,
		},
		{
			code: `
Object.assign({})
`,
			snapshot: `
Object.assign({})
~~~~~~~~~~~~~~~~~
\`Object.assign()\` with a single object literal argument is unnecessary.
`,
		},
		{
			code: `
Object.assign({ name: 'test' })
`,
			snapshot: `
Object.assign({ name: 'test' })
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
\`Object.assign()\` with a single object literal argument is unnecessary.
`,
		},
		{
			code: `
Object.assign({ id: 1, name: 'example', active: true })
`,
			snapshot: `
Object.assign({ id: 1, name: 'example', active: true })
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
\`Object.assign()\` with a single object literal argument is unnecessary.
`,
		},
		{
			code: `
const source = {};
const result = Object.assign({}, source)
`,
			snapshot: `
const source = {};
const result = Object.assign({}, source)
               ~~~~~~~~~~~~~~~~~~~~~~~~~
               \`Object.assign()\` with an object literal as the first argument can be replaced with object spread syntax.
`,
		},
		{
			code: `
const userOptions = {};
const config = Object.assign({ timeout: 5000 }, userOptions)
`,
			snapshot: `
const userOptions = {};
const config = Object.assign({ timeout: 5000 }, userOptions)
               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
               \`Object.assign()\` with an object literal as the first argument can be replaced with object spread syntax.
`,
		},
		{
			code: `
const existing = {};
const additional = {};
Object.assign({ ...existing }, additional)
`,
			snapshot: `
const existing = {};
const additional = {};
Object.assign({ ...existing }, additional)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
\`Object.assign()\` with an object literal as the first argument can be replaced with object spread syntax.
`,
		},
		{
			code: `
const computed = "key";
const value = 1;
const other = {};
Object.assign({ [computed]: value }, other)
`,
			snapshot: `
const computed = "key";
const value = 1;
const other = {};
Object.assign({ [computed]: value }, other)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
\`Object.assign()\` with an object literal as the first argument can be replaced with object spread syntax.
`,
		},
		{
			code: `
const shorthand = 1;
const other = {};
Object.assign({ shorthand }, other)
`,
			snapshot: `
const shorthand = 1;
const other = {};
Object.assign({ shorthand }, other)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
\`Object.assign()\` with an object literal as the first argument can be replaced with object spread syntax.
`,
		},
		{
			code: `
const baseConfig = {};
Object.assign(
    {},
    baseConfig,
    { customSetting: true }
)
`,
			snapshot: `
const baseConfig = {};
Object.assign(
~~~~~~~~~~~~~~
\`Object.assign()\` with an object literal as the first argument can be replaced with object spread syntax.
    {},
    ~~~
    baseConfig,
    ~~~~~~~~~~~
    { customSetting: true }
    ~~~~~~~~~~~~~~~~~~~~~~~
)
~
`,
		},
		{
			code: `
const nested = {};
Object.assign({}, Object.assign({}, nested))
`,
			snapshot: `
const nested = {};
Object.assign({}, Object.assign({}, nested))
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
\`Object.assign()\` with an object literal as the first argument can be replaced with object spread syntax.
                  ~~~~~~~~~~~~~~~~~~~~~~~~~
                  \`Object.assign()\` with an object literal as the first argument can be replaced with object spread syntax.
`,
		},
		{
			code: `
const deep = {};
Object.assign({ outer: 1 }, Object.assign({ inner: 2 }, deep))
`,
			snapshot: `
const deep = {};
Object.assign({ outer: 1 }, Object.assign({ inner: 2 }, deep))
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
\`Object.assign()\` with an object literal as the first argument can be replaced with object spread syntax.
                            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                            \`Object.assign()\` with an object literal as the first argument can be replaced with object spread syntax.
`,
		},
		{
			code: `
const first = {};
const item = {};
const last = {};
[first, Object.assign({}, item), last]
`,
			snapshot: `
const first = {};
const item = {};
const last = {};
[first, Object.assign({}, item), last]
        ~~~~~~~~~~~~~~~~~~~~~~~
        \`Object.assign()\` with an object literal as the first argument can be replaced with object spread syntax.
`,
		},
		{
			code: `
const data = {};
function transform() { return Object.assign({}, data); }
`,
			snapshot: `
const data = {};
function transform() { return Object.assign({}, data); }
                              ~~~~~~~~~~~~~~~~~~~~~~~
                              \`Object.assign()\` with an object literal as the first argument can be replaced with object spread syntax.
`,
		},
		{
			code: `
declare function process(value: unknown): void;
const params = {};
process(Object.assign({}, params))
`,
			snapshot: `
declare function process(value: unknown): void;
const params = {};
process(Object.assign({}, params))
        ~~~~~~~~~~~~~~~~~~~~~~~~~
        \`Object.assign()\` with an object literal as the first argument can be replaced with object spread syntax.
`,
		},
		{
			code: `
const inner = {};
const options = { key: 'value', nested: Object.assign({}, inner) }
`,
			snapshot: `
const inner = {};
const options = { key: 'value', nested: Object.assign({}, inner) }
                                        ~~~~~~~~~~~~~~~~~~~~~~~~
                                        \`Object.assign()\` with an object literal as the first argument can be replaced with object spread syntax.
`,
		},
		{
			code: `
Object.assign({ get accessor() { return 1; } })
`,
			snapshot: `
Object.assign({ get accessor() { return 1; } })
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
\`Object.assign()\` with a single object literal argument is unnecessary.
`,
		},
		{
			code: `
Object.assign({ set accessor(value: unknown) {} })
`,
			snapshot: `
Object.assign({ set accessor(value: unknown) {} })
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
\`Object.assign()\` with a single object literal argument is unnecessary.
`,
		},
	],
	valid: [
		`
const target = {};
const source = {};
Object.assign(target, source)
`,
		`
const target = {};
Object.assign(target, { name: 'test' })
`,
		`
const existingObject = {};
Object.assign(existingObject, { id: 1 })
`,
		`
const source = {};
const result = { ...source }
`,
		`
const sources: [object] = [{}];
Object.assign(...sources)
`,
		`
const sources = [{}];
Object.assign({}, ...sources)
`,
		`
const source = {};
const CustomObject = { assign(...values: unknown[]) { return values; } };
CustomObject.assign({}, source)
`,
		`
const source = {};
const myObject = { assign(...values: unknown[]) { return values; } };
myObject.assign({}, source)
`,
		`
const other = {};
Object.assign({ get accessor() { return 1; } }, other)
`,
		`
const other = {};
Object.assign({ set accessor(value: unknown) {} }, other)
`,
		`
const config = {};
Object.assign({ name: 'test', get accessor() { return 1; } }, config)
`,
		`Object.assign({ name: 'test', set accessor(value: unknown) {} }, { setting: true })`,
		`Object.assign({}, { get accessor() { return 1; } })`,
		`Object.assign({}, { set accessor(value: unknown) {} })`,
		`Object.assign({}, { name: 'test', get accessor() { return 1; } }, {})`,
		`
const config = {};
const settings = {};
const extra = {};
Object.assign({ config }, settings, {}, { flag: true, set accessor(value: unknown) {}, extra }, {})
`,
		`
const assign = (...values: unknown[]) => values;
const source = {};
assign({}, source)
`,
		`
const data = {};
class Object { static assign(...values: unknown[]) { return values; } }
Object.assign({}, data);
export {}
`,
	],
});
