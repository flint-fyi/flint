import { ruleTester } from "../ruleTester.ts";
import rule from "./toHaveLengthMatchers.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const files: string[];
expect(files.length).toBe(1);
`,
			output: `
declare const files: string[];
expect(files).toHaveLength(1);
`,
			snapshot: `
declare const files: string[];
expect(files.length).toBe(1);
                     ~~~~
                     Prefer \`toHaveLength()\` over an equality matcher on \`.length\`.
`,
		},
		{
			code: `
declare const files: string[];
expect(files.length).toEqual(1);
`,
			output: `
declare const files: string[];
expect(files).toHaveLength(1);
`,
			snapshot: `
declare const files: string[];
expect(files.length).toEqual(1);
                     ~~~~~~~
                     Prefer \`toHaveLength()\` over an equality matcher on \`.length\`.
`,
		},
		{
			code: `
declare const files: string[];
expect(files.length).toStrictEqual(1);
`,
			output: `
declare const files: string[];
expect(files).toHaveLength(1);
`,
			snapshot: `
declare const files: string[];
expect(files.length).toStrictEqual(1);
                     ~~~~~~~~~~~~~
                     Prefer \`toHaveLength()\` over an equality matcher on \`.length\`.
`,
		},
		{
			code: `
declare const files: string[];
expect(files.length).not.toBe(1);
`,
			output: `
declare const files: string[];
expect(files).not.toHaveLength(1);
`,
			snapshot: `
declare const files: string[];
expect(files.length).not.toBe(1);
                         ~~~~
                         Prefer \`toHaveLength()\` over an equality matcher on \`.length\`.
`,
		},
		{
			code: `
declare const files: string[];
expect(files.length)["not"].toBe(1);
`,
			output: `
declare const files: string[];
expect(files)["not"].toHaveLength(1);
`,
			snapshot: `
declare const files: string[];
expect(files.length)["not"].toBe(1);
                            ~~~~
                            Prefer \`toHaveLength()\` over an equality matcher on \`.length\`.
`,
		},
		{
			code: `
declare const files: string[];
expect(files.length)["toBe"](1);
`,
			output: `
declare const files: string[];
expect(files).toHaveLength(1);
`,
			snapshot: `
declare const files: string[];
expect(files.length)["toBe"](1);
                     ~~~~~~
                     Prefer \`toHaveLength()\` over an equality matcher on \`.length\`.
`,
		},
		{
			code: `
declare const files: string[];
expect(files["length"]).toBe(1);
`,
			output: `
declare const files: string[];
expect(files).toHaveLength(1);
`,
			snapshot: `
declare const files: string[];
expect(files["length"]).toBe(1);
                        ~~~~
                        Prefer \`toHaveLength()\` over an equality matcher on \`.length\`.
`,
		},
		{
			code: `
declare const count: number;
declare const result: { files: string[] };
expect(result.files.length).toBe(count);
`,
			output: `
declare const count: number;
declare const result: { files: string[] };
expect(result.files).toHaveLength(count);
`,
			snapshot: `
declare const count: number;
declare const result: { files: string[] };
expect(result.files.length).toBe(count);
                            ~~~~
                            Prefer \`toHaveLength()\` over an equality matcher on \`.length\`.
`,
		},
	],
	valid: [
		`
declare const files: string[];
expect(files).toHaveLength(1);
`,
		`
declare const files: string[];
expect(files.length).toBeGreaterThan(1);
`,
		`
declare const files: string[];
expect(files.at).toBe(undefined);
`,
		`
declare const files: string[];
declare const index: number;
expect(files[index]).toBe("index.ts");
`,
		`
declare const count: number;
expect(count).toBe(1);
`,
		`
declare const maybeFiles: string[] | undefined;
expect(maybeFiles?.length).toBe(1);
`,
		`
declare const maybeResult: { files: string[] } | undefined;
expect(maybeResult?.files.length).toBe(1);
`,
		`
declare const files: string[];
declare const verify: (value: unknown) => { toBe: (expected: unknown) => void };
verify(files.length).toBe(1);
`,
	],
});
