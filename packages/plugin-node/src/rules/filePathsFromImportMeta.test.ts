import rule from "./filePathsFromImportMeta.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const filename = fileURLToPath(import.meta.url);
`,
			snapshot: `
const filename = fileURLToPath(import.meta.url);
                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                 Prefer \`import.meta.filename\` over \`fileURLToPath(import.meta.url)\`.
`,
		},
		{
			code: `
const dirname = path.dirname(fileURLToPath(import.meta.url));
`,
			snapshot: `
const dirname = path.dirname(fileURLToPath(import.meta.url));
                ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                Prefer \`import.meta.dirname\` over legacy directory path techniques.
`,
		},
		{
			code: `
const dirname = path.dirname(import.meta.filename);
`,
			snapshot: `
const dirname = path.dirname(import.meta.filename);
                ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                Prefer \`import.meta.dirname\` over legacy directory path techniques.
`,
		},
		{
			code: `
const dirname = fileURLToPath(new URL('.', import.meta.url));
`,
			snapshot: `
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
		`const other = fileURLToPath(someOtherUrl);`,
		`const other = path.dirname(someOtherPath);`,
		`const custom = new URL('.', customUrl);`,
	],
});
