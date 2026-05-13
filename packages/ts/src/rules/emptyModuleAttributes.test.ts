import rule from "./emptyModuleAttributes.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import data from "./data.json" with {};
`,
			output: `
import data from "./data.json" ;
`,
			snapshot: `
import data from "./data.json" with {};
                               ~~~~~~~
                               Empty import attributes serve no purpose and should be removed.
`,
		},
		{
			code: `
import { x } from "./module" with {};
`,
			output: `
import { x } from "./module" ;
`,
			snapshot: `
import { x } from "./module" with {};
                             ~~~~~~~
                             Empty import attributes serve no purpose and should be removed.
`,
		},
		{
			code: `
export { x } from "./module" with {};
`,
			output: `
export { x } from "./module" ;
`,
			snapshot: `
export { x } from "./module" with {};
                             ~~~~~~~
                             Empty import attributes serve no purpose and should be removed.
`,
		},
		{
			code: `
export * from "./module" with {};
`,
			output: `
export * from "./module" ;
`,
			snapshot: `
export * from "./module" with {};
                         ~~~~~~~
                         Empty import attributes serve no purpose and should be removed.
`,
		},
	],
	valid: [
		`import data from "./data.json" with { type: "json" };`,
		`import { x } from "./module";`,
		`export { x } from "./module";`,
		`export * from "./module";`,
		`import styles from "./styles.css" with { type: "css" };`,
	],
});
