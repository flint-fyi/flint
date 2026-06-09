import rule from "./floatingPromises.ts";
import { domLibRuleTester } from "./ruleTester.ts";

domLibRuleTester.describe(rule, {
	invalid: [
		{
			code: `
async function getValue(): Promise<number> { return 1; }
getValue();
`,
			snapshot: `
async function getValue(): Promise<number> { return 1; }
getValue();
~~~~~~~~~~~
Promises must be awaited, returned, or have their errors handled with \`.catch()\` or \`.then()\` with a rejection handler.
`,
		},
		{
			code: `
const promise = Promise.resolve(1);
promise;
`,
			snapshot: `
const promise = Promise.resolve(1);
promise;
~~~~~~~~
Promises must be awaited, returned, or have their errors handled with \`.catch()\` or \`.then()\` with a rejection handler.
`,
		},
		{
			code: `
Promise.resolve(1);
`,
			snapshot: `
Promise.resolve(1);
~~~~~~~~~~~~~~~~~~~
Promises must be awaited, returned, or have their errors handled with \`.catch()\` or \`.then()\` with a rejection handler.
`,
		},
		{
			code: `
new Promise((resolve) => resolve(1));
`,
			snapshot: `
new Promise((resolve) => resolve(1));
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Promises must be awaited, returned, or have their errors handled with \`.catch()\` or \`.then()\` with a rejection handler.
`,
		},
		{
			code: `
Promise.resolve(1).then(() => {});
`,
			snapshot: `
Promise.resolve(1).then(() => {});
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Promises must be awaited, returned, or have their errors handled with \`.catch()\` or \`.then()\` with a rejection handler.
`,
		},
		{
			code: `
Promise.resolve(1).finally(() => {});
`,
			snapshot: `
Promise.resolve(1).finally(() => {});
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Promises must be awaited, returned, or have their errors handled with \`.catch()\` or \`.then()\` with a rejection handler.
`,
		},
		{
			code: `
async function getValue(): Promise<number> { return 1; }
true ? getValue() : getValue();
`,
			snapshot: `
async function getValue(): Promise<number> { return 1; }
true ? getValue() : getValue();
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Promises must be awaited, returned, or have their errors handled with \`.catch()\` or \`.then()\` with a rejection handler.
`,
		},
		{
			code: `
async function getValue(): Promise<number> { return 1; }
true && getValue();
`,
			snapshot: `
async function getValue(): Promise<number> { return 1; }
true && getValue();
~~~~~~~~~~~~~~~~~~~
Promises must be awaited, returned, or have their errors handled with \`.catch()\` or \`.then()\` with a rejection handler.
`,
		},
		{
			code: `
async function getValue(): Promise<number> { return 1; }
null ?? getValue();
`,
			snapshot: `
async function getValue(): Promise<number> { return 1; }
null ?? getValue();
~~~~~~~~~~~~~~~~~~~
Promises must be awaited, returned, or have their errors handled with \`.catch()\` or \`.then()\` with a rejection handler.
`,
		},
		{
			code: `
[Promise.resolve(1), Promise.resolve(2)];
`,
			snapshot: `
[Promise.resolve(1), Promise.resolve(2)];
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Promises must be awaited, returned, or have their errors handled with \`.catch()\` or \`.then()\` with a rejection handler.
`,
		},
	],
	valid: [
		`await Promise.resolve(1);`,
		`await new Promise((resolve) => resolve(1));`,
		`const result = await Promise.resolve(1);`,
		`Promise.resolve(1).catch(() => {});`,
		`Promise.resolve(1).then(() => {}, () => {});`,
		`Promise.resolve(1).then(() => {}).catch(() => {});`,
		`Promise.resolve(1).finally(() => {}).catch(() => {});`,
		`void Promise.resolve(1);`,
		`const promise = Promise.resolve(1);`,
		`function getValue() { return Promise.resolve(1); }`,
		`async function test() { return Promise.resolve(1); }`,
		`const x = condition ? Promise.resolve(1) : Promise.resolve(2);`,
		`await Promise.all([Promise.resolve(1), Promise.resolve(2)]);`,
		`1 + 2;`,
		`console.log("hello");`,
		`const value = 42;`,
	],
});
