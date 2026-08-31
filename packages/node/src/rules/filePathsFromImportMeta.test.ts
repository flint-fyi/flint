import rule from "./filePathsFromImportMeta.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare function fileURLToPath(url: string | URL): string;
const filename = fileURLToPath(import.meta.url);
`,
			snapshot: `
declare function fileURLToPath(url: string | URL): string;
const filename = fileURLToPath(import.meta.url);
                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                 Prefer \`import.meta.filename\` over \`fileURLToPath(import.meta.url)\`.
`,
		},
		{
			code: `
declare const path: { dirname(p: string): string; };
declare function fileURLToPath(url: string | URL): string;
const dirname = path.dirname(fileURLToPath(import.meta.url));
`,
			snapshot: `
declare const path: { dirname(p: string): string; };
declare function fileURLToPath(url: string | URL): string;
const dirname = path.dirname(fileURLToPath(import.meta.url));
                ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                Prefer \`import.meta.dirname\` over legacy directory path techniques.
`,
		},
		{
			code: `
declare const path: { dirname(p: string): string; };
const dirname = path.dirname(import.meta.filename);
`,
			snapshot: `
declare const path: { dirname(p: string): string; };
const dirname = path.dirname(import.meta.filename);
                ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                Prefer \`import.meta.dirname\` over legacy directory path techniques.
`,
		},
		{
			code: `
declare function fileURLToPath(url: string | URL): string;
const dirname = fileURLToPath(new URL('.', import.meta.url));
`,
			snapshot: `
declare function fileURLToPath(url: string | URL): string;
const dirname = fileURLToPath(new URL('.', import.meta.url));
                ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                Prefer \`import.meta.dirname\` over legacy directory path techniques.
`,
		},
		{
			code: `
import path from "node:path";
import { fileURLToPath } from "node:url";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(fileURLToPath(import.meta.url));
`,
			snapshot: `
import path from "node:path";
import { fileURLToPath } from "node:url";

const filename = fileURLToPath(import.meta.url);
                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                 Prefer \`import.meta.filename\` over \`fileURLToPath(import.meta.url)\`.
const dirname = path.dirname(fileURLToPath(import.meta.url));
                ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                Prefer \`import.meta.dirname\` over legacy directory path techniques.
`,
		},
	],
	valid: [
		`const filename = import.meta.filename;`,
		`const dirname = import.meta.dirname;`,
		`const url = import.meta.url;`,
		`declare function fileURLToPath(url: string | URL): string; declare const someOtherUrl: string; const other = fileURLToPath(someOtherUrl);`,
		`declare const path: { dirname(p: string): string; }; declare const someOtherPath: string; const other = path.dirname(someOtherPath);`,
		`declare const customUrl: string; const custom = new URL('.', customUrl);`,
	],
});
