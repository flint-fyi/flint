import rule from "./arrayFlatUnnecessaryDepths.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const array: number[][];
array.flat(1);
`,
			snapshot: `
declare const array: number[][];
array.flat(1);
           ~
           Unnecessary depth argument of \`1\` in \`.flat()\` call.
`,
		},
		{
			code: `
declare const array: number[][] | undefined;
array?.flat(1);
`,
			snapshot: `
declare const array: number[][] | undefined;
array?.flat(1);
            ~
            Unnecessary depth argument of \`1\` in \`.flat()\` call.
`,
		},
		{
			code: `
[1, [2, 3]].flat(1);
`,
			snapshot: `
[1, [2, 3]].flat(1);
                 ~
                 Unnecessary depth argument of \`1\` in \`.flat()\` call.
`,
		},
		{
			code: `
function process<T extends number[][]>(arr: T) {
	return arr.flat(1);
}
`,
			snapshot: `
function process<T extends number[][]>(arr: T) {
	return arr.flat(1);
	                ~
	                Unnecessary depth argument of \`1\` in \`.flat()\` call.
}
`,
		},
	],
	valid: [
		`declare const array: number[][]; array.flat();`,
		`declare const array: number[][][]; array.flat(2);`,
		`declare const array: number[]; array.flat(Infinity);`,
		`declare const array: number[]; array.flat(0);`,
		`declare const depth: number; [1, 2].flat(depth);`,
		`declare const obj: { flat(depth: number): number[] }; obj.flat(1);`,
	],
});
