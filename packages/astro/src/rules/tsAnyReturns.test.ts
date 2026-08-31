import "@flint.fyi/astro-language";

import rule from "../../../ts/src/rules/anyReturns.ts";
import { ruleTester } from "./ruleTester.ts";

const myComponentFixture = {
	"MyComponent.astro": "<div>Hello!</div>",
};

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
---
function foo() {
	return 1 as any
}
---
			
`,
			snapshot: `
---
function foo() {
	return 1 as any
	~~~~~~~~~~~~~~~
	Unsafe return of a value of type \`any\`.
}
---
			
`,
		},
		{
			code: `
<div>
	{
		function foo() {
			return 1 as any
		}
	}
</div>
			
`,
			snapshot: `
<div>
	{
		function foo() {
			return 1 as any
			~~~~~~~~~~~~~~~
			Unsafe return of a value of type \`any\`.
		}
	}
</div>
			
`,
		},
	],
	valid: [
		{
			code: `
---
function getAstroUrl() {
	return Astro.url
}
---
`,
			files: {
				"node_modules/astro/astro-jsx.d.ts": "",
				"node_modules/astro/env.d.ts": `
declare const Astro: {
	url: URL;
};
`,
			},
			name: "Astro global types are injected",
		},
		{
			code: `
---
import MyComponent from "./MyComponent.astro"

function foo() {
	return MyComponent
}
---
`,
			files: myComponentFixture,
		},
	],
});
