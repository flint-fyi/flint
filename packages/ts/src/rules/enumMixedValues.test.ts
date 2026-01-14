import rule from "./enumMixedValues.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `const value = { ...Promise.resolve({ key: 1 }) };`,
			snapshot: `const value = { ...Promise.resolve({ key: 1 }) };
                ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                Spreading a Promise into an object can cause unexpected behavior.`,
		},
		{
			code: `const fn = () => ({ key: 1 }); const value = { ...fn };`,
			snapshot: `const fn = () => ({ key: 1 }); const value = { ...fn };
                                               ~~~~~
                                               Spreading a function without properties into an object can cause unexpected behavior.`,
		},
		{
			code: `const map = new Map([["a", 1]]); const value = { ...map };`,
			snapshot: `const map = new Map([["a", 1]]); const value = { ...map };
                                                 ~~~~~~
                                                 Spreading a Map into an object will result in an empty object.`,
		},
		{
			code: `const items = [1, 2, 3]; const value = { ...items };`,
			snapshot: `const items = [1, 2, 3]; const value = { ...items };
                                         ~~~~~~~~
                                         Spreading an array into an object will result in a list of indices as keys.`,
		},
		{
			code: `const set = new Set([1, 2]); const value = { ...set };`,
			snapshot: `const set = new Set([1, 2]); const value = { ...set };
                                             ~~~~~~
                                             Spreading an iterable into an object can cause unexpected behavior.`,
		},
		{
			code: `class Example { method() {} } const instance = new Example(); const value = { ...instance };`,
			snapshot: `class Example { method() {} } const instance = new Example(); const value = { ...instance };
                                                                              ~~~~~~~~~~~
                                                                              Spreading a class instance into an object will lose its prototype.`,
		},
		{
			code: `const text = "hello"; const chars = [...text];`,
			snapshot: `const text = "hello"; const chars = [...text];
                                     ~~~~~~~
                                     Spreading a string into an array can mishandle special characters.`,
		},
	],
	valid: [
		`const source = { a: 1 }; const target = { ...source };`,
		`const items = [1, 2, 3]; const copy = [...items];`,
		`async function run() { const value = { ...(await Promise.resolve({ key: 1 })) }; }`,
		`const fn = () => ({ key: 1 }); const value = fn();`,
		`const map = new Map([["a", 1]]); const obj = Object.fromEntries(map);`,
		`class Example { prop = 1; } const value = { ...new Example() };`,
		`function withProps() {} withProps.extra = 1; const value = { ...withProps };`,
	],
});
