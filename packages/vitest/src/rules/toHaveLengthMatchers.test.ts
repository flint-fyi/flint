import { createRuleTester } from "../ruleTester.ts";
import rule from "./toHaveLengthMatchers.ts";

const ruleTester = createRuleTester({
	"toHaveLengthMatchers.globals.d.ts": `
declare const count: number;
declare const files: string[];
declare const index: number;
declare const maybeFiles: string[] | undefined;
declare const result: { files: string[] };
declare const maybeResult: { files: string[] } | undefined;
declare const verify: (value: unknown) => { toBe: (expected: unknown) => void };
`,
});

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
expect(files.length).toBe(1);
`,
			output: `
expect(files).toHaveLength(1);
`,
			snapshot: `
expect(files.length).toBe(1);
                     ~~~~
                     Prefer \`toHaveLength()\` over an equality matcher on \`.length\`.
`,
		},
		{
			code: `
expect(files.length).toEqual(1);
`,
			output: `
expect(files).toHaveLength(1);
`,
			snapshot: `
expect(files.length).toEqual(1);
                     ~~~~~~~
                     Prefer \`toHaveLength()\` over an equality matcher on \`.length\`.
`,
		},
		{
			code: `
expect(files.length).toStrictEqual(1);
`,
			output: `
expect(files).toHaveLength(1);
`,
			snapshot: `
expect(files.length).toStrictEqual(1);
                     ~~~~~~~~~~~~~
                     Prefer \`toHaveLength()\` over an equality matcher on \`.length\`.
`,
		},
		{
			code: `
expect(files.length).not.toBe(1);
`,
			output: `
expect(files).not.toHaveLength(1);
`,
			snapshot: `
expect(files.length).not.toBe(1);
                         ~~~~
                         Prefer \`toHaveLength()\` over an equality matcher on \`.length\`.
`,
		},
		{
			code: `
expect(files.length)["not"].toBe(1);
`,
			output: `
expect(files)["not"].toHaveLength(1);
`,
			snapshot: `
expect(files.length)["not"].toBe(1);
                            ~~~~
                            Prefer \`toHaveLength()\` over an equality matcher on \`.length\`.
`,
		},
		{
			code: `
expect(files.length)["toBe"](1);
`,
			output: `
expect(files).toHaveLength(1);
`,
			snapshot: `
expect(files.length)["toBe"](1);
                     ~~~~~~
                     Prefer \`toHaveLength()\` over an equality matcher on \`.length\`.
`,
		},
		{
			code: `
expect(files["length"]).toBe(1);
`,
			output: `
expect(files).toHaveLength(1);
`,
			snapshot: `
expect(files["length"]).toBe(1);
                        ~~~~
                        Prefer \`toHaveLength()\` over an equality matcher on \`.length\`.
`,
		},
		{
			code: `
expect(result.files.length).toBe(count);
`,
			output: `
expect(result.files).toHaveLength(count);
`,
			snapshot: `
expect(result.files.length).toBe(count);
                            ~~~~
                            Prefer \`toHaveLength()\` over an equality matcher on \`.length\`.
`,
		},
	],
	valid: [
		`expect(files).toHaveLength(1);`,
		`expect(files.length).toBeGreaterThan(1);`,
		`expect(files.at).toBe(undefined);`,
		`expect(files[index]).toBe("index.ts");`,
		`expect(count).toBe(1);`,
		`expect(maybeFiles?.length).toBe(1);`,
		`expect(maybeResult?.files.length).toBe(1);`,
		`verify(files.length).toBe(1);`,
	],
});
