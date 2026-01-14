import rule from "./globalObjectCalls.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const result = Math();
`,
			snapshot: `
const result = Math();
               ~~~~
               Math is not a function and cannot be called directly.
`,
		},
		{
			code: `
const data = JSON();
`,
			snapshot: `
const data = JSON();
             ~~~~
             JSON is not a function and cannot be called directly.
`,
		},
		{
			code: `
const reflected = Reflect();
`,
			snapshot: `
const reflected = Reflect();
                  ~~~~~~~
                  Reflect is not a function and cannot be called directly.
`,
		},
		{
			code: `
const atomic = Atomics();
`,
			snapshot: `
const atomic = Atomics();
               ~~~~~~~
               Atomics is not a function and cannot be called directly.
`,
		},
		{
			code: `
const instance = new Math();
`,
			snapshot: `
const instance = new Math();
                     ~~~~
                     Math is not a function and cannot be called directly.
`,
		},
		{
			code: `
const instance = new JSON();
`,
			snapshot: `
const instance = new JSON();
                     ~~~~
                     JSON is not a function and cannot be called directly.
`,
		},
		{
			code: `
const instance = new Reflect();
`,
			snapshot: `
const instance = new Reflect();
                     ~~~~~~~
                     Reflect is not a function and cannot be called directly.
`,
		},
		{
			code: `
const instance = new Atomics();
`,
			snapshot: `
const instance = new Atomics();
                     ~~~~~~~
                     Atomics is not a function and cannot be called directly.
`,
		},
	],
	valid: [
		`const value = Math.abs(-5);`,
		`const parsed = JSON.parse("{}");`,
		`const stringified = JSON.stringify({});`,
		`const keys = Reflect.ownKeys({});`,
		`const result = Atomics.add(buffer, 0, 1);`,
	],
});
