import rule from "./nativeObjectExtensions.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
Array.prototype.custom = function() {};
`,
			snapshot: `
Array.prototype.custom = function() {};
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Extending the Array prototype modifies built-in behavior that other code depends on.
`,
		},
		{
			code: `
Object.prototype.custom = 123;
`,
			snapshot: `
Object.prototype.custom = 123;
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Extending the Object prototype modifies built-in behavior that other code depends on.
`,
		},
		{
			code: `
String.prototype.toTitleCase = function() { return this; };
`,
			snapshot: `
String.prototype.toTitleCase = function() { return this; };
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Extending the String prototype modifies built-in behavior that other code depends on.
`,
		},
		{
			code: `
Number.prototype.clamp = function() { return this; };
`,
			snapshot: `
Number.prototype.clamp = function() { return this; };
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Extending the Number prototype modifies built-in behavior that other code depends on.
`,
		},
		{
			code: `
Boolean.prototype.toggle = function() { return !this; };
`,
			snapshot: `
Boolean.prototype.toggle = function() { return !this; };
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Extending the Boolean prototype modifies built-in behavior that other code depends on.
`,
		},
		{
			code: `
Function.prototype.once = function() { return this; };
`,
			snapshot: `
Function.prototype.once = function() { return this; };
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Extending the Function prototype modifies built-in behavior that other code depends on.
`,
		},
		{
			code: `
Date.prototype.format = function() { return ""; };
`,
			snapshot: `
Date.prototype.format = function() { return ""; };
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Extending the Date prototype modifies built-in behavior that other code depends on.
`,
		},
		{
			code: `
RegExp.prototype.toSource = function() { return ""; };
`,
			snapshot: `
RegExp.prototype.toSource = function() { return ""; };
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Extending the RegExp prototype modifies built-in behavior that other code depends on.
`,
		},
		{
			code: `
Error.prototype.toJSON = function() { return {}; };
`,
			snapshot: `
Error.prototype.toJSON = function() { return {}; };
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Extending the Error prototype modifies built-in behavior that other code depends on.
`,
		},
		{
			code: `
Map.prototype.toObject = function() { return {}; };
`,
			snapshot: `
Map.prototype.toObject = function() { return {}; };
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Extending the Map prototype modifies built-in behavior that other code depends on.
`,
		},
		{
			code: `
Set.prototype.toArray = function() { return []; };
`,
			snapshot: `
Set.prototype.toArray = function() { return []; };
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Extending the Set prototype modifies built-in behavior that other code depends on.
`,
		},
		{
			code: `
Promise.prototype.always = function() { return this; };
`,
			snapshot: `
Promise.prototype.always = function() { return this; };
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Extending the Promise prototype modifies built-in behavior that other code depends on.
`,
		},
		{
			code: `
Symbol.prototype.description = "value";
`,
			snapshot: `
Symbol.prototype.description = "value";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Extending the Symbol prototype modifies built-in behavior that other code depends on.
`,
		},
		{
			code: `
BigInt.prototype.toJSON = function() { return ""; };
`,
			snapshot: `
BigInt.prototype.toJSON = function() { return ""; };
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Extending the BigInt prototype modifies built-in behavior that other code depends on.
`,
		},
		{
			code: `
WeakMap.prototype.clear = function() {};
`,
			snapshot: `
WeakMap.prototype.clear = function() {};
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Extending the WeakMap prototype modifies built-in behavior that other code depends on.
`,
		},
		{
			code: `
WeakSet.prototype.clear = function() {};
`,
			snapshot: `
WeakSet.prototype.clear = function() {};
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Extending the WeakSet prototype modifies built-in behavior that other code depends on.
`,
		},
		{
			code: `
Array.prototype["custom"] = function() {};
`,
			snapshot: `
Array.prototype["custom"] = function() {};
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Extending the Array prototype modifies built-in behavior that other code depends on.
`,
		},
		{
			code: `
Object.prototype["method"] = function() {};
`,
			snapshot: `
Object.prototype["method"] = function() {};
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Extending the Object prototype modifies built-in behavior that other code depends on.
`,
		},
		{
			code: `
Array["prototype"]["custom"] = function() {};
`,
			snapshot: `
Array["prototype"]["custom"] = function() {};
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Extending the Array prototype modifies built-in behavior that other code depends on.
`,
		},
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
		{
			code: `
TypeError.prototype.toJSON = function() { return {}; };
`,
			snapshot: `
TypeError.prototype.toJSON = function() { return {}; };
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Extending the TypeError prototype modifies built-in behavior that other code depends on.
`,
		},
		{
			code: `
RangeError.prototype.custom = function() {};
`,
			snapshot: `
RangeError.prototype.custom = function() {};
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Extending the RangeError prototype modifies built-in behavior that other code depends on.
`,
		},
		{
			code: `
Uint8Array.prototype.custom = function() {};
`,
			snapshot: `
Uint8Array.prototype.custom = function() {};
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Extending the Uint8Array prototype modifies built-in behavior that other code depends on.
`,
		},
		{
			code: `
Float32Array.prototype.custom = function() {};
`,
			snapshot: `
Float32Array.prototype.custom = function() {};
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Extending the Float32Array prototype modifies built-in behavior that other code depends on.
`,
		},
		{
			code: `
ArrayBuffer.prototype.custom = function() {};
`,
			snapshot: `
ArrayBuffer.prototype.custom = function() {};
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Extending the ArrayBuffer prototype modifies built-in behavior that other code depends on.
`,
		},
		{
			code: `
DataView.prototype.custom = function() {};
`,
			snapshot: `
DataView.prototype.custom = function() {};
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Extending the DataView prototype modifies built-in behavior that other code depends on.
`,
		},
	],
	valid: [
		`const prototype = Array.prototype;`,
		`const value = Array.prototype.map;`,
		`const hasOwn = Object.prototype.hasOwnProperty;`,
		`Array.prototype.map.call(items, callback);`,
		`Object.prototype.hasOwnProperty.call(obj, "key");`,
		`const MyClass = { prototype: {} }; MyClass.prototype.custom = function() {};`,
		`class MyArray extends Array {}; MyArray.prototype.custom = function() {};`,
		`function MyConstructor() {}; MyConstructor.prototype.custom = function() {};`,
		`const obj = { prototype: {} }; obj.prototype.method = function() {};`,
		`const custom = { Array: { prototype: {} } }; custom.Array.prototype.method = function() {};`,
		`Object.keys(Array.prototype);`,
		`Object.getOwnPropertyNames(Array.prototype);`,
		`Object.getPrototypeOf(Array.prototype);`,
		`typeof Array.prototype.map === "function";`,
		`"map" in Array.prototype;`,
		`Array.isArray(value);`,
		`Object.create(Array.prototype);`,
	],
});
