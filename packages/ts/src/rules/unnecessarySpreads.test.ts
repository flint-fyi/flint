import { ruleTester } from "./ruleTester.ts";
import rule from "./unnecessarySpreads.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const values = [0, ...[1, 2]];
`,
			output: `
const values = [0, 1, 2];
`,
			snapshot: `
const values = [0, ...[1, 2]];
                   ~~~~~~~~~
                   Spreading this literal into the surrounding literal or argument list is unnecessary.
`,
		},
		{
			code: `
consume(...[1, , 3]);
`,
			output: `
consume(1, undefined, 3);
`,
			snapshot: `
consume(...[1, , 3]);
        ~~~~~~~~~~~
        Spreading this literal into the surrounding literal or argument list is unnecessary.
`,
		},
		{
			code: `
const object = { ...{ name: "value" } };
`,
			output: `
const object = { name: "value" };
`,
			snapshot: `
const object = { ...{ name: "value" } };
                 ~~~~~~~~~~~~~~~~~~~~
                 Spreading this literal into the surrounding literal or argument list is unnecessary.
`,
		},
		{
			code: `
const values = [...Array.from(input)];
`,
			output: `
const values = (Array.from(input));
`,
			snapshot: `
const values = [...Array.from(input)];
               ~~~~~~~~~~~~~~~~~~~~~~
               Spreading this newly created array creates a second array.
`,
		},
		{
			code: `
for (const value of [...input]) consume(value);
`,
			snapshot: `
for (const value of [...input]) consume(value);
                    ~~~~~~~~~~
                    This operation can consume the iterable without first creating a spread array.
`,
		},
		{
			code: `
new Set(...input);
`,
			snapshot: `
new Set(...input);
        ~~~~~~~~
        Pass the iterable as one argument to the standard \`Set\` constructor instead of spreading it into arguments.
`,
		},
		{
			code: `
new Set(...[1, 2]);
`,
			snapshot: `
new Set(...[1, 2]);
        ~~~~~~~~~
        Spreading this literal into the surrounding literal or argument list is unnecessary.
`,
		},
		{
			code: `
Object.assign(target, { ...source });
`,
			snapshot: `
Object.assign(target, { ...source });
                      ~~~~~~~~~~~~~
                      This spread-only object is an unnecessary \`Object.assign()\` source wrapper.
`,
		},
		{
			code: `
const values = [...(Array())];
`,
			output: `
const values = (Array());
`,
			snapshot: `
const values = [...(Array())];
               ~~~~~~~~~~~~~~
               Spreading this newly created array creates a second array.
`,
		},
		{
			code: `
const values = [...new Array(3)];
`,
			snapshot: `
const values = [...new Array(3)];
               ~~~~~~~~~~~~~~~~~
               Spreading this newly created array creates a second array.
`,
		},
		{
			code: `
const values = [...new Array()];
`,
			output: `
const values = (new Array());
`,
			snapshot: `
const values = [...new Array()];
               ~~~~~~~~~~~~~~~~
               Spreading this newly created array creates a second array.
`,
		},
		{
			code: `
const values = [...Array.of(1, 2)];
`,
			output: `
const values = (Array.of(1, 2));
`,
			snapshot: `
const values = [...Array.of(1, 2)];
               ~~~~~~~~~~~~~~~~~~~
               Spreading this newly created array creates a second array.
`,
		},
		{
			code: `
const values = [...Object.keys({})];
`,
			output: `
const values = (Object.keys({}));
`,
			snapshot: `
const values = [...Object.keys({})];
               ~~~~~~~~~~~~~~~~~~~~
               Spreading this newly created array creates a second array.
`,
		},
		{
			code: `
const values = [..."text".split("")];
`,
			output: `
const values = ("text".split(""));
`,
			snapshot: `
const values = [..."text".split("")];
               ~~~~~~~~~~~~~~~~~~~~~
               Spreading this newly created array creates a second array.
`,
		},
		{
			code: `
const values = [...[1, 2].map(String)];
`,
			output: `
const values = ([1, 2].map(String));
`,
			snapshot: `
const values = [...[1, 2].map(String)];
               ~~~~~~~~~~~~~~~~~~~~~~~
               Spreading this newly created array creates a second array.
`,
		},
		{
			code: `
const values = [...([1] as number[] | readonly number[]).slice()];
`,
			output: `
const values = (([1] as number[] | readonly number[]).slice());
`,
			snapshot: `
const values = [...([1] as number[] | readonly number[]).slice()];
               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
               Spreading this newly created array creates a second array.
`,
		},
		{
			code: `
const values = [...await Promise.all(input)];
`,
			output: `
const values = (await Promise.all(input));
`,
			snapshot: `
const values = [...await Promise.all(input)];
               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
               Spreading this newly created array creates a second array.
`,
		},
		{
			code: `
const values = [...await Promise.allSettled(input)];
`,
			output: `
const values = (await Promise.allSettled(input));
`,
			snapshot: `
const values = [...await Promise.allSettled(input)];
               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
               Spreading this newly created array creates a second array.
`,
		},
		{
			code: `
new Map([...input]);
`,
			snapshot: `
new Map([...input]);
        ~~~~~~~~~~
        This operation can consume the iterable without first creating a spread array.
`,
		},
		{
			code: `
new Uint8Array([...input]);
`,
			snapshot: `
new Uint8Array([...input]);
               ~~~~~~~~~~
               This operation can consume the iterable without first creating a spread array.
`,
		},
		{
			code: `
Uint16Array.from([...input]);
`,
			snapshot: `
Uint16Array.from([...input]);
                 ~~~~~~~~~~
                 This operation can consume the iterable without first creating a spread array.
`,
		},
		{
			code: `
Promise.all([...input]);
`,
			snapshot: `
Promise.all([...input]);
            ~~~~~~~~~~
            This operation can consume the iterable without first creating a spread array.
`,
		},
		{
			code: `
Promise.allSettled([...input]);
`,
			snapshot: `
Promise.allSettled([...input]);
                   ~~~~~~~~~~
                   This operation can consume the iterable without first creating a spread array.
`,
		},
		{
			code: `
Promise.any([...input]);
`,
			snapshot: `
Promise.any([...input]);
            ~~~~~~~~~~
            This operation can consume the iterable without first creating a spread array.
`,
		},
		{
			code: `
Promise.race([...input]);
`,
			snapshot: `
Promise.race([...input]);
             ~~~~~~~~~~
             This operation can consume the iterable without first creating a spread array.
`,
		},
		{
			code: `
Object.fromEntries([...input]);
`,
			snapshot: `
Object.fromEntries([...input]);
                   ~~~~~~~~~~
                   This operation can consume the iterable without first creating a spread array.
`,
		},
		{
			code: `
function* generate() { yield* [...input]; }
`,
			snapshot: `
function* generate() { yield* [...input]; }
                              ~~~~~~~~~~
                              This operation can consume the iterable without first creating a spread array.
`,
		},
		{
			code: `
async function run() { for await (const value of [...input]) consume(value); }
`,
			snapshot: `
async function run() { for await (const value of [...input]) consume(value); }
                                                 ~~~~~~~~~~
                                                 This operation can consume the iterable without first creating a spread array.
`,
		},
		{
			code: `
new Map(...input);
`,
			snapshot: `
new Map(...input);
        ~~~~~~~~
        Pass the iterable as one argument to the standard \`Map\` constructor instead of spreading it into arguments.
`,
		},
		{
			code: `
new WeakMap(...input);
`,
			snapshot: `
new WeakMap(...input);
            ~~~~~~~~
            Pass the iterable as one argument to the standard \`WeakMap\` constructor instead of spreading it into arguments.
`,
		},
		{
			code: `
new WeakSet(...input);
`,
			snapshot: `
new WeakSet(...input);
            ~~~~~~~~
            Pass the iterable as one argument to the standard \`WeakSet\` constructor instead of spreading it into arguments.
`,
		},
		{
			code: `
const values = [...[, 1]];
`,
			snapshot: `
const values = [...[, 1]];
                ~~~~~~~~
                Spreading this literal into the surrounding literal or argument list is unnecessary.
`,
		},
		{
			code: `
const values = [...[/* retained */ 1]];
`,
			snapshot: `
const values = [...[/* retained */ 1]];
                ~~~~~~~~~~~~~~~~~~~~~
                Spreading this literal into the surrounding literal or argument list is unnecessary.
`,
		},
		{
			code: `
const object = { ...{ get value() { return 1; } } };
`,
			snapshot: `
const object = { ...{ get value() { return 1; } } };
                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                 Spreading this literal into the surrounding literal or argument list is unnecessary.
`,
		},
		{
			code: `
const object = { ...{ method() {} } };
`,
			snapshot: `
const object = { ...{ method() {} } };
                 ~~~~~~~~~~~~~~~~~~
                 Spreading this literal into the surrounding literal or argument list is unnecessary.
`,
		},
		{
			code: `
const object = { ...{ __proto__: source } };
`,
			snapshot: `
const object = { ...{ __proto__: source } };
                 ~~~~~~~~~~~~~~~~~~~~~~~~
                 Spreading this literal into the surrounding literal or argument list is unnecessary.
`,
		},
		{
			code: `
Object.assign(target, { ...first, ...second }, third);
`,
			snapshot: `
Object.assign(target, { ...first, ...second }, third);
                      ~~~~~~~~~~~~~~~~~~~~~~~
                      This spread-only object is an unnecessary \`Object.assign()\` source wrapper.
`,
		},
		{
			code: `
Object.assign(...targets, target, { ...source });
`,
			snapshot: `
Object.assign(...targets, target, { ...source });
                                  ~~~~~~~~~~~~~
                                  This spread-only object is an unnecessary \`Object.assign()\` source wrapper.
`,
		},
		{
			code: `
const values = [...Array.from(input)] as const;
`,
			snapshot: `
const values = [...Array.from(input)] as const;
               ~~~~~~~~~~~~~~~~~~~~~~
               Spreading this newly created array creates a second array.
`,
		},
		{
			code: `
const values = [...[]];
`,
			snapshot: `
const values = [...[]];
                ~~~~~
                Spreading this literal into the surrounding literal or argument list is unnecessary.
`,
		},
		{
			code: `
const values = [...(([1, 2]))];
`,
			output: `
const values = [1, 2];
`,
			snapshot: `
const values = [...(([1, 2]))];
                ~~~~~~~~~~~~~
                Spreading this literal into the surrounding literal or argument list is unnecessary.
`,
		},
	],
	valid: [
		`const custom = { map: () => [] as string[] }; const values = [...custom.map()];`,
		`const custom = [1] as number[] & { marker: true }; const values = [...custom.map(String)];`,
		`const values = [...await input];`,
		`const values = [...await Promise.race(input)];`,
		`const values = [...input];`,
		`const values = [...makeArray()];`,
		`const values = [...new Uint8Array()];`,
		`const values = [...Iterator.from(input).map(String)];`,
		`const values = [...Object.create(null)];`,
		`const values = [...items.reduce((all, item) => [...all, item], [])];`,
		`const values = globalThis.Promise.all([...input]);`,
		`Object["assign"](target, { ...source });`,
		`Object.assign({ ...target }, source);`,
		`Object.assign(...targets, { ...source });`,
	],
});
