import rule from "./explicitAnys.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `const value: any = 1;`,
			snapshot: `const value: any = 1;
             ~~~
             Avoid using the any type as it disables type checking for the annotated value.`,
		},
		{
			code: `function process(input: any): void {}`,
			snapshot: `function process(input: any): void {}
                        ~~~
                        Avoid using the any type as it disables type checking for the annotated value.`,
		},
		{
			code: `function get(): any { return null; }`,
			snapshot: `function get(): any { return null; }
                ~~~
                Avoid using the any type as it disables type checking for the annotated value.`,
		},
		{
			code: `const items: any[] = [];`,
			snapshot: `const items: any[] = [];
             ~~~
             Avoid using the any type as it disables type checking for the annotated value.`,
		},
		{
			code: `type Callback = (value: any) => void;`,
			snapshot: `type Callback = (value: any) => void;
                        ~~~
                        Avoid using the any type as it disables type checking for the annotated value.`,
		},
	],
	valid: [
		`const value: unknown = 1;`,
		`const value: string = "hello";`,
		`function process(input: unknown): void {}`,
		`const items: string[] = [];`,
		`type Callback = (value: unknown) => void;`,
	],
});
