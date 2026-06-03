import rule from "./documentWrites.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
document.write("...");
`,
			snapshot: `
document.write("...");
         ~~~~~
         \`document.write()\` blocks HTML parsing and can introduce injection risks.
`,
		},
		{
			code: `
document.writeln("...");
`,
			snapshot: `
document.writeln("...");
         ~~~~~~~
         \`document.writeln()\` blocks HTML parsing and can introduce injection risks.
`,
		},
		{
			code: `
window.document.write("...");
`,
			snapshot: `
window.document.write("...");
                ~~~~~
                \`document.write()\` blocks HTML parsing and can introduce injection risks.
`,
		},
	],
	valid: [
		`document.createElement("main");`,
		`
			declare const other: { document: { write(value: string): void } };
			other.document.write("...");
		`,
		`
			const document = { write(value: string) {}, writeln(value: string) {} };
			document.write("...");
			document.writeln("...");
			export {};
		`,
		`
			const window = { document: { write(value: string) {}, writeln(value: string) {} } };
			window.document.write("...");
			window.document.writeln("...");
			export {};
		`,
	],
});
