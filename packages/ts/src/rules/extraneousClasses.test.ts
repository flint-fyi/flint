import rule from "./extraneousClasses.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `class Empty {}`,
			snapshot: `class Empty {}
      ~~~~~
      Class 'Empty' is empty.`,
		},
		{
			code: `class StaticOnly { static method() {} }`,
			snapshot: `class StaticOnly { static method() {} }
      ~~~~~~~~~~
      Class 'StaticOnly' contains only static members and can be replaced with a module.`,
		},
		{
			code: `class Utils { static add(a: number, b: number) { return a + b; } static multiply(a: number, b: number) { return a * b; } }`,
			snapshot: `class Utils { static add(a: number, b: number) { return a + b; } static multiply(a: number, b: number) { return a * b; } }
      ~~~~~
      Class 'Utils' contains only static members and can be replaced with a module.`,
		},
		{
			code: `class Factory { constructor() { console.log("created"); } }`,
			snapshot: `class Factory { constructor() { console.log("created"); } }
      ~~~~~~~
      Class 'Factory' contains only a constructor and can be replaced with a function.`,
		},
	],
	valid: [
		`class Counter { value = 0; increment() { this.value++; } }`,
		`class Person { name: string; constructor(name: string) { this.name = name; } }`,
		`abstract class Base { abstract method(): void; }`,
		`class Extended extends Base { method() {} }`,
	],
});
