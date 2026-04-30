import rule from "./objectAssignSpreads.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
Object.assign({}, source)
`,
			snapshot: `
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
Object.assign({}, defaults, userConfig)
`,
			snapshot: `
Object.assign({}, defaults, userConfig)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
\`Object.assign()\` with an object literal as the first argument can be replaced with object spread syntax.
`,
		},
		{
			code: `
Object.assign({ id: 1 }, data)
`,
			snapshot: `
Object.assign({ id: 1 }, data)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
\`Object.assign()\` with an object literal as the first argument can be replaced with object spread syntax.
`,
		},
		{
			code: `
Object.assign({ name: 'default', active: true }, overrides, extra)
`,
			snapshot: `
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
const result = Object.assign({}, source)
`,
			snapshot: `
const result = Object.assign({}, source)
               ~~~~~~~~~~~~~~~~~~~~~~~~~
               \`Object.assign()\` with an object literal as the first argument can be replaced with object spread syntax.
`,
		},
		{
			code: `
const config = Object.assign({ timeout: 5000 }, userOptions)
`,
			snapshot: `
const config = Object.assign({ timeout: 5000 }, userOptions)
               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
               \`Object.assign()\` with an object literal as the first argument can be replaced with object spread syntax.
`,
		},
		{
			code: `
Object.assign({ ...existing }, additional)
`,
			snapshot: `
Object.assign({ ...existing }, additional)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
\`Object.assign()\` with an object literal as the first argument can be replaced with object spread syntax.
`,
		},
		{
			code: `
Object.assign({ [computed]: value }, other)
`,
			snapshot: `
Object.assign({ [computed]: value }, other)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
\`Object.assign()\` with an object literal as the first argument can be replaced with object spread syntax.
`,
		},
		{
			code: `
Object.assign({ shorthand }, other)
`,
			snapshot: `
Object.assign({ shorthand }, other)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
\`Object.assign()\` with an object literal as the first argument can be replaced with object spread syntax.
`,
		},
		{
			code: `
Object.assign(
    {},
    baseConfig,
    { customSetting: true }
)
`,
			snapshot: `
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
Object.assign({}, Object.assign({}, nested))
`,
			snapshot: `
Object.assign({}, Object.assign({}, nested))
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
\`Object.assign()\` with an object literal as the first argument can be replaced with object spread syntax.
                  ~~~~~~~~~~~~~~~~~~~~~~~~~
                  \`Object.assign()\` with an object literal as the first argument can be replaced with object spread syntax.
`,
		},
		{
			code: `
Object.assign({ outer: 1 }, Object.assign({ inner: 2 }, deep))
`,
			snapshot: `
Object.assign({ outer: 1 }, Object.assign({ inner: 2 }, deep))
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
\`Object.assign()\` with an object literal as the first argument can be replaced with object spread syntax.
                            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                            \`Object.assign()\` with an object literal as the first argument can be replaced with object spread syntax.
`,
		},
		{
			code: `
[first, Object.assign({}, item), last]
`,
			snapshot: `
[first, Object.assign({}, item), last]
        ~~~~~~~~~~~~~~~~~~~~~~~
        \`Object.assign()\` with an object literal as the first argument can be replaced with object spread syntax.
`,
		},
		{
			code: `
function transform() { return Object.assign({}, data); }
`,
			snapshot: `
function transform() { return Object.assign({}, data); }
                              ~~~~~~~~~~~~~~~~~~~~~~~
                              \`Object.assign()\` with an object literal as the first argument can be replaced with object spread syntax.
`,
		},
		{
			code: `
process(Object.assign({}, params))
`,
			snapshot: `
process(Object.assign({}, params))
        ~~~~~~~~~~~~~~~~~~~~~~~~~
        \`Object.assign()\` with an object literal as the first argument can be replaced with object spread syntax.
`,
		},
		{
			code: `
const options = { key: 'value', nested: Object.assign({}, inner) }
`,
			snapshot: `
const options = { key: 'value', nested: Object.assign({}, inner) }
                                        ~~~~~~~~~~~~~~~~~~~~~~~~
                                        \`Object.assign()\` with an object literal as the first argument can be replaced with object spread syntax.
`,
		},
		{
			code: `
Object.assign({ get accessor() {} })
`,
			snapshot: `
Object.assign({ get accessor() {} })
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
\`Object.assign()\` with a single object literal argument is unnecessary.
`,
		},
		{
			code: `
Object.assign({ set accessor(value) {} })
`,
			snapshot: `
Object.assign({ set accessor(value) {} })
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
\`Object.assign()\` with a single object literal argument is unnecessary.
`,
		},
	],
	valid: [
		`Object.assign()`,
		`Object.assign(target, source)`,
		`Object.assign(target, { name: 'test' })`,
		`Object.assign(existingObject, { id: 1 })`,
		`const result = { ...source }`,
		`Object.assign(...sources)`,
		`Object.assign({}, ...sources)`,
		`const CustomObject = {}; CustomObject.assign({}, source)`,
		`myObject.assign({}, source)`,
		`Object.assign({ get accessor() {} }, other)`,
		`Object.assign({ set accessor(value) {} }, other)`,
		`Object.assign({ name: 'test', get accessor() {} }, config)`,
		`Object.assign({ name: 'test', set accessor(value) {} }, { setting: true })`,
		`Object.assign({}, { get accessor() {} })`,
		`Object.assign({}, { set accessor(value) {} })`,
		`Object.assign({}, { name: 'test', get accessor() {} }, {})`,
		`Object.assign({ config }, settings, {}, { flag: true, set accessor(value) {}, extra }, {})`,
		`import { assign } from 'utils'; assign({}, source)`,
		`class Object {} Object.assign({}, data); export {}`,
	],
});
