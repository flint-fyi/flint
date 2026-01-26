import rule from "./typeConstituentDuplicates.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `type Value = string | string;`,
			snapshot: `type Value = string | string;
                      ~~~~~~
                      Duplicate type in union.`,
		},
		{
			code: `type Value = 1 | 2 | 1;`,
			snapshot: `type Value = 1 | 2 | 1;
                     ~
                     Duplicate type in union.`,
		},
		{
			code: `type Value = "a" | "b" | "a";`,
			snapshot: `type Value = "a" | "b" | "a";
                         ~~~
                         Duplicate type in union.`,
		},
		{
			code: `type Value = A & B & A;`,
			snapshot: `type Value = A & B & A;
                     ~
                     Duplicate type in intersection.`,
		},
		{
			code: `type Value = { name: string } & { name: string };`,
			snapshot: `type Value = { name: string } & { name: string };
                                ~~~~~~~~~~~~~~~~
                                Duplicate type in intersection.`,
		},
		{
			code: `type Value = Array<string> | Array<string>;`,
			snapshot: `type Value = Array<string> | Array<string>;
                             ~~~~~~~~~~~~~
                             Duplicate type in union.`,
		},
	],
	valid: [
		`type Value = string | number;`,
		`type Value = 1 | 2 | 3;`,
		`type Value = "a" | "b" | "c";`,
		`type Value = A & B & C;`,
		`type Value = { name: string } & { age: number };`,
		`type Value = Array<string> | Array<number>;`,
		`type Value = string;`,
	],
});
