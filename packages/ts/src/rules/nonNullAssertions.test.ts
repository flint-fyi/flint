import rule from "./nonNullAssertions.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const value: string | null;
value!;
`,
			snapshot: `
declare const value: string | null;
value!;
     ~
     Non-null assertions bypass TypeScript's strict null checking.
`,
		},
		{
			code: `
declare const object: { property: string } | null;
object!.property;
`,
			snapshot: `
declare const object: { property: string } | null;
object!.property;
      ~
      Non-null assertions bypass TypeScript's strict null checking.
`,
		},
		{
			code: `
declare const array: string[] | null;
array![0];
`,
			snapshot: `
declare const array: string[] | null;
array![0];
     ~
     Non-null assertions bypass TypeScript's strict null checking.
`,
		},
		{
			code: `
declare const callable: (() => void) | null;
callable!();
`,
			snapshot: `
declare const callable: (() => void) | null;
callable!();
        ~
        Non-null assertions bypass TypeScript's strict null checking.
`,
		},
		{
			code: `
declare const value: string | null;
value!.toString();
`,
			snapshot: `
declare const value: string | null;
value!.toString();
     ~
     Non-null assertions bypass TypeScript's strict null checking.
`,
		},
		{
			code: `
declare const outer: { inner: { value: string } | null };
outer.inner!.value;
`,
			snapshot: `
declare const outer: { inner: { value: string } | null };
outer.inner!.value;
           ~
           Non-null assertions bypass TypeScript's strict null checking.
`,
		},
		{
			code: `
declare function getValue(): string | undefined;
getValue()!;
`,
			snapshot: `
declare function getValue(): string | undefined;
getValue()!;
          ~
          Non-null assertions bypass TypeScript's strict null checking.
`,
		},
		{
			code: `
declare const values: (string | null)[];
values.map((value) => value!);
`,
			snapshot: `
declare const values: (string | null)[];
values.map((value) => value!);
                           ~
                           Non-null assertions bypass TypeScript's strict null checking.
`,
		},
	],
	valid: [
		`
declare const value: string;
value;
`,
		`
declare const object: { property: string };
object.property;
`,
		`
declare const value: string | null;
value ?? "default";
`,
		`
declare const object: { property: string } | null;
object?.property;
`,
		`
declare const value: string | null;
if (value !== null) {
    value.toUpperCase();
}
`,
	],
});
