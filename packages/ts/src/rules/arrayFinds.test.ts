import rule from "./arrayFinds.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const values: number[] = [1, 2, 3];
const first = values.filter((value) => value > 0)[0];
`,
			output: `
const values: number[] = [1, 2, 3];
const first = values.find((value) => value > 0);
`,
			snapshot: `
const values: number[] = [1, 2, 3];
const first = values.filter((value) => value > 0)[0];
                     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                     Prefer \`.find()\` over \`.filter()[0]\` when looking for a single element.
`,
		},
		{
			code: `
const values: string[] = ["a", "b", "c"];
const found = values.filter((value) => value === "b")[0];
`,
			output: `
const values: string[] = ["a", "b", "c"];
const found = values.find((value) => value === "b");
`,
			snapshot: `
const values: string[] = ["a", "b", "c"];
const found = values.filter((value) => value === "b")[0];
                     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                     Prefer \`.find()\` over \`.filter()[0]\` when looking for a single element.
`,
		},
		{
			code: `
const items: { id: number }[] = [{ id: 1 }, { id: 2 }];
const item = items.filter((item) => item.id === 1)[0];
`,
			output: `
const items: { id: number }[] = [{ id: 1 }, { id: 2 }];
const item = items.find((item) => item.id === 1);
`,
			snapshot: `
const items: { id: number }[] = [{ id: 1 }, { id: 2 }];
const item = items.filter((item) => item.id === 1)[0];
                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                   Prefer \`.find()\` over \`.filter()[0]\` when looking for a single element.
`,
		},
		{
			code: `
const values: number[] = [1, 2, 3];
const first = values.filter(isPositive)[0];
`,
			output: `
const values: number[] = [1, 2, 3];
const first = values.find(isPositive);
`,
			snapshot: `
const values: number[] = [1, 2, 3];
const first = values.filter(isPositive)[0];
                     ~~~~~~~~~~~~~~~~~~~~~
                     Prefer \`.find()\` over \`.filter()[0]\` when looking for a single element.
`,
		},
	],
	valid: [
		`const values: number[] = [1, 2, 3]; const first = values.find((value) => value > 0);`,
		`const values: number[] = [1, 2, 3]; const all = values.filter((value) => value > 0);`,
		`const values: number[] = [1, 2, 3]; const second = values.filter((value) => value > 0)[1];`,
		`const str = "hello"; const first = str.split("")[0];`,
		`const set = new Set([1, 2, 3]); const values = [...set][0];`,
	],
});
