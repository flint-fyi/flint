import rule from "./arraySomeMethods.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const values: number[] = [1, 2, 3];
const hasPositive = values.filter((value) => value > 0).length > 0;
`,
			output: `
const values: number[] = [1, 2, 3];
const hasPositive = values.some((value) => value > 0);
`,
			snapshot: `
const values: number[] = [1, 2, 3];
const hasPositive = values.filter((value) => value > 0).length > 0;
                    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                    Prefer \`.some()\` to more cleanly check if an array contains a matching element.
`,
		},
		{
			code: `
const items: string[] = ["a", "b", "c"];
const hasMatch = items.filter((item) => item === "b").length !== 0;
`,
			output: `
const items: string[] = ["a", "b", "c"];
const hasMatch = items.some((item) => item === "b");
`,
			snapshot: `
const items: string[] = ["a", "b", "c"];
const hasMatch = items.filter((item) => item === "b").length !== 0;
                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                 Prefer \`.some()\` to more cleanly check if an array contains a matching element.
`,
		},
		{
			code: `
const data: number[] = [1, 2, 3];
const exists = data.filter(isValid).length >= 1;
`,
			output: `
const data: number[] = [1, 2, 3];
const exists = data.some(isValid);
`,
			snapshot: `
const data: number[] = [1, 2, 3];
const exists = data.filter(isValid).length >= 1;
               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
               Prefer \`.some()\` to more cleanly check if an array contains a matching element.
`,
		},
		{
			code: `
const values: number[] = [1, 2, 3];
const hasMatch = values.findIndex((value) => value > 2) !== -1;
`,
			output: `
const values: number[] = [1, 2, 3];
const hasMatch = values.some((value) => value > 2);
`,
			snapshot: `
const values: number[] = [1, 2, 3];
const hasMatch = values.findIndex((value) => value > 2) !== -1;
                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                 Prefer \`.some()\` to more cleanly check if an array contains a matching element.
`,
		},
		{
			code: `
const items: string[] = ["a", "b", "c"];
const exists = items.findLastIndex((item) => item === "a") !== -1;
`,
			output: `
const items: string[] = ["a", "b", "c"];
const exists = items.some((item) => item === "a");
`,
			snapshot: `
const items: string[] = ["a", "b", "c"];
const exists = items.findLastIndex((item) => item === "a") !== -1;
               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
               Prefer \`.some()\` to more cleanly check if an array contains a matching element.
`,
		},
	],
	valid: [
		`const values: number[] = [1, 2, 3]; const hasPositive = values.some((value) => value > 0);`,
		`const values: number[] = [1, 2, 3]; const filtered = values.filter((value) => value > 0);`,
		`const values: number[] = [1, 2, 3]; const count = values.filter((value) => value > 0).length;`,
		`const values: number[] = [1, 2, 3]; const hasTwo = values.filter((value) => value > 0).length > 2;`,
		`const values: number[] = [1, 2, 3]; const index = values.findIndex((value) => value > 2);`,
		`const values: number[] = [1, 2, 3]; const found = values.find((value) => value > 2);`,
		`const obj = { filter: () => ({ length: 1 }) }; const result = obj.filter(() => true).length > 0;`,
	],
});
