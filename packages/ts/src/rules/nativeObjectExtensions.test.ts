import rule from "./nativeObjectExtensions.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
Object.defineProperty(Array.prototype, "custom", { value: function() {} });
`,
			snapshot: `
Object.defineProperty(Array.prototype, "custom", { value: function() {} });
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Extending the Array prototype modifies built-in behavior that other code depends on.
`,
		},
		{
			code: `
Object.defineProperty(Object.prototype, "method", { value: 123 });
`,
			snapshot: `
Object.defineProperty(Object.prototype, "method", { value: 123 });
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Extending the Object prototype modifies built-in behavior that other code depends on.
`,
		},
		{
			code: `
Object.defineProperty(String.prototype, "toTitleCase", { value: function() {} });
`,
			snapshot: `
Object.defineProperty(String.prototype, "toTitleCase", { value: function() {} });
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Extending the String prototype modifies built-in behavior that other code depends on.
`,
		},
		{
			code: `
Object.defineProperties(Array.prototype, { custom: { value: function() {} } });
`,
			snapshot: `
Object.defineProperties(Array.prototype, { custom: { value: function() {} } });
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Extending the Array prototype modifies built-in behavior that other code depends on.
`,
		},
		{
			code: `
Object.defineProperties(Object.prototype, { method: { value: 123 } });
`,
			snapshot: `
Object.defineProperties(Object.prototype, { method: { value: 123 } });
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Extending the Object prototype modifies built-in behavior that other code depends on.
`,
		},
	],
	valid: [
		`const prototype = Array.prototype;`,
		`const value = Array.prototype.map;`,
		`const hasOwn = Object.prototype.hasOwnProperty;`,
		`
const items = [1, 2, 3];
const callback = (value: number) => value * 2;
Array.prototype.map.call(items, callback);
`,
		`
const obj = { key: "value" };
Object.prototype.hasOwnProperty.call(obj, "key");
`,
		`const MyClass: { prototype: { custom?: () => void } } = { prototype: {} }; MyClass.prototype.custom = function() {};`,
		`interface MyArray { custom: () => void; } class MyArray extends Array {}; MyArray.prototype.custom = function() {};`,
		`function MyConstructor() {}; MyConstructor.prototype.custom = function() {};`,
		`const obj: { prototype: { method?: () => void } } = { prototype: {} }; obj.prototype.method = function() {};`,
		`const custom: { Array: { prototype: { method?: () => void } } } = { Array: { prototype: {} } }; custom.Array.prototype.method = function() {};`,
		`Object.keys(Array.prototype);`,
		`Object.getOwnPropertyNames(Array.prototype);`,
		`Object.getPrototypeOf(Array.prototype);`,
		`typeof Array.prototype.map === "function";`,
		`"map" in Array.prototype;`,
		`
const value: unknown[] = [];
Array.isArray(value);
`,
		`Object.create(Array.prototype);`,
	],
});
