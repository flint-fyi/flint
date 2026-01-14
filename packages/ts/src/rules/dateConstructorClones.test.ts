import rule from "./dateConstructorClones.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const original = new Date();
new Date(original.getTime());
`,
			snapshot: `
const original = new Date();
new Date(original.getTime());
                  ~~~~~~~~~
                  Prefer passing the Date directly instead of calling getTime().
`,
		},
		{
			code: `
const original = new Date();
const clone = new Date(original.getTime());
`,
			snapshot: `
const original = new Date();
const clone = new Date(original.getTime());
                                ~~~~~~~~~
                                Prefer passing the Date directly instead of calling getTime().
`,
		},
		{
			code: `
function cloneDate(date: Date) {
    return new Date(date.getTime());
}
`,
			snapshot: `
function cloneDate(date: Date) {
    return new Date(date.getTime());
                         ~~~~~~~~~
                         Prefer passing the Date directly instead of calling getTime().
}
`,
		},
	],
	valid: [
		"const date = new Date(); new Date(date);",
		"new Date();",
		"new Date(2024, 0, 1);",
		"const timestamp = 123; new Date(timestamp);",
		"new Date('2024-01-01');",
		"const date = new Date(); date.getTime();",
		"const value = { getTime: (n: number) => n }; new Date(value.getTime(1));",
		"const obj = { getTimestamp: () => 0 }; new Date(obj.getTimestamp());",
		"class MyDate { getTime() { return 0; } } new Date(new MyDate().getTime());",
		"const date: Date | undefined = new Date(); new Date(date?.getTime() ?? 0);",
	],
});
