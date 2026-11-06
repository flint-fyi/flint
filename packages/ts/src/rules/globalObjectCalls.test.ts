import rule from "./globalObjectCalls.ts";
import { javascriptRuleTester, ruleTester } from "./ruleTester.ts";

javascriptRuleTester.describe(rule, {
	invalid: [
		{
			files: {
				"file.js": `
const result = Math();
`,
			},
			snapshot: {
				"file.js": `
const result = Math();
               ~~~~
               Math is not a function and cannot be called directly.
`,
			},
		},
		{
			files: {
				"file.js": `
const data = JSON();
`,
			},
			snapshot: {
				"file.js": `
const data = JSON();
             ~~~~
             JSON is not a function and cannot be called directly.
`,
			},
		},
		{
			files: {
				"file.js": `
const reflected = Reflect();
`,
			},
			snapshot: {
				"file.js": `
const reflected = Reflect();
                  ~~~~~~~
                  Reflect is not a function and cannot be called directly.
`,
			},
		},
		{
			files: {
				"file.js": `
const atomic = Atomics();
`,
			},
			snapshot: {
				"file.js": `
const atomic = Atomics();
               ~~~~~~~
               Atomics is not a function and cannot be called directly.
`,
			},
		},
		{
			files: {
				"file.js": `
const instance = new Math();
`,
			},
			snapshot: {
				"file.js": `
const instance = new Math();
                     ~~~~
                     Math is not a function and cannot be called directly.
`,
			},
		},
		{
			files: {
				"file.js": `
const instance = new JSON();
`,
			},
			snapshot: {
				"file.js": `
const instance = new JSON();
                     ~~~~
                     JSON is not a function and cannot be called directly.
`,
			},
		},
		{
			files: {
				"file.js": `
const instance = new Reflect();
`,
			},
			snapshot: {
				"file.js": `
const instance = new Reflect();
                     ~~~~~~~
                     Reflect is not a function and cannot be called directly.
`,
			},
		},
		{
			files: {
				"file.js": `
const instance = new Atomics();
`,
			},
			snapshot: {
				"file.js": `
const instance = new Atomics();
                     ~~~~~~~
                     Atomics is not a function and cannot be called directly.
`,
			},
		},
	],
	valid: [],
});

ruleTester.describe(rule, {
	invalid: [],
	valid: [
		`const value = Math.abs(-5); void value;`,
		`const parsed = JSON.parse("{}"); void parsed;`,
		`const stringified = JSON.stringify({}); void stringified;`,
		`const keys = Reflect.ownKeys({}); void keys;`,
		`const buffer = new Int32Array(1); const result = Atomics.add(buffer, 0, 1); void result;`,
	],
});
