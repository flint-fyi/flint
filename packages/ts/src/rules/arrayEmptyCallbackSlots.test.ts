import rule from "./arrayEmptyCallbackSlots.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
new Array(5).map((_) => 0);
`,
			snapshot: `
new Array(5).map((_) => 0);
             ~~~
             This callback will not be invoked.
`,
		},
		{
			code: `
new Array(10).filter((value) => value > 0);
`,
			snapshot: `
new Array(10).filter((value) => value > 0);
              ~~~~~~
              This callback will not be invoked.
`,
		},
		{
			code: `
new Array(3).forEach((item) => console.log(item));
`,
			snapshot: `
new Array(3).forEach((item) => console.log(item));
             ~~~~~~~
             This callback will not be invoked.
`,
		},
		{
			code: `
new Array(5).every((value) => value !== undefined);
`,
			snapshot: `
new Array(5).every((value) => value !== undefined);
             ~~~~~
             This callback will not be invoked.
`,
		},
		{
			code: `
new Array(5).some((value) => value === undefined);
`,
			snapshot: `
new Array(5).some((value) => value === undefined);
             ~~~~
             This callback will not be invoked.
`,
		},
		{
			code: `
new Array(5).find((value) => value === 1);
`,
			snapshot: `
new Array(5).find((value) => value === 1);
             ~~~~
             This callback will not be invoked.
`,
		},
		{
			code: `
new Array(5).reduce((acc, value) => acc + value, 0);
`,
			snapshot: `
new Array(5).reduce((acc, value) => acc + value, 0);
             ~~~~~~
             This callback will not be invoked.
`,
		},
		{
			code: `
const callback = (value: number) => value * 2;
new Array(5).map(callback);
`,
			snapshot: `
const callback = (value: number) => value * 2;
new Array(5).map(callback);
             ~~~
             This callback will not be invoked.
`,
		},
	],
	valid: [
		`new Array(5).fill(0).map((_) => 1);`,
		`new Array(5).fill(undefined).forEach((item) => console.log(item));`,
		`Array.from({ length: 5 }, (_, index) => index);`,
		`new Array("a", "b", "c").forEach((item) => console.log(item));`,
		`new Array(1, 2, 3).map((value) => value * 2);`,
		`new Array(...items).filter((value) => value > 0);`,
		`[1, 2, 3].map((value) => value * 2);`,
		`new Array(5).flat();`,
		`new Array(5).concat([1, 2, 3]);`,
		`new Array(5).join(",");`,
		`const arr: number[] = []; arr.map((value) => value * 2);`,
		`new Array(someVariable).map((x) => x);`,
	],
});
