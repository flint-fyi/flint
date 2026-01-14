import rule from "./eventClasses.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import { EventEmitter } from "events";

class Derived extends EventEmitter {}
`,
			snapshot: `
import { EventEmitter } from "events";

class Derived extends EventEmitter {}
                      ~~~~~~~~~~~~
                      Prefer the cross-platform \`EventTarget\` over the Node.js-specific \`EventEmitter\`.
`,
		},
		{
			code: `
import { EventEmitter } from "node:events";

class Derived extends EventEmitter {}
`,
			snapshot: `
import { EventEmitter } from "node:events";

class Derived extends EventEmitter {}
                      ~~~~~~~~~~~~
                      Prefer the cross-platform \`EventTarget\` over the Node.js-specific \`EventEmitter\`.
`,
		},
		{
			code: `
import { EventEmitter } from "events";

const emitter = new EventEmitter();
`,
			snapshot: `
import { EventEmitter } from "events";

const emitter = new EventEmitter();
                    ~~~~~~~~~~~~
                    Prefer the cross-platform \`EventTarget\` over the Node.js-specific \`EventEmitter\`.
`,
		},
		{
			code: `
import { EventEmitter } from "node:events";

const emitter = new EventEmitter();
`,
			snapshot: `
import { EventEmitter } from "node:events";

const emitter = new EventEmitter();
                    ~~~~~~~~~~~~
                    Prefer the cross-platform \`EventTarget\` over the Node.js-specific \`EventEmitter\`.
`,
		},
		{
			code: `
import { EventEmitter as EE } from "events";

class MyClass extends EE {}
`,
			snapshot: `
import { EventEmitter as EE } from "events";

class MyClass extends EE {}
                      ~~
                      Prefer the cross-platform \`EventTarget\` over the Node.js-specific \`EventEmitter\`.
`,
		},
		{
			code: `
import { EventEmitter as EE } from "events";

const instance = new EE();
`,
			snapshot: `
import { EventEmitter as EE } from "events";

const instance = new EE();
                     ~~
                     Prefer the cross-platform \`EventTarget\` over the Node.js-specific \`EventEmitter\`.
`,
		},
	],
	valid: [
		`class Derived extends EventTarget {}`,
		`const target = new EventTarget();`,
		`
			import { EventEmitter } from "./custom-emitter";
			class Derived extends EventEmitter {}
		`,
		`
			import { EventEmitter } from "./custom-emitter";
			const emitter = new EventEmitter();
		`,
		`
			class EventEmitter {}
			class Derived extends EventEmitter {}
		`,
		`
			class EventEmitter {}
			const instance = new EventEmitter();
		`,
		`
			import { EventTarget } from "events";
			class Derived extends EventTarget {}
		`,
	],
});
