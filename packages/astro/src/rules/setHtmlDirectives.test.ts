import { ruleTester } from "./ruleTester.ts";
import rule from "./setHtmlDirectives.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
---
let string = 'this string contains some <strong>HTML!!!</strong>'
---

<p set:html={string}></p>
`,
			snapshot: `
---
let string = 'this string contains some <strong>HTML!!!</strong>'
---

<p set:html={string}></p>
   ~~~~~~~~
   Avoid using \`set:html\`. Astro does not escape its value.
`,
		},
		{
			code: `
<div>
	<p set:html=\`this string contains some <strong>HTML!!!</strong>\`></p>
</div>
`,
			snapshot: `
<div>
	<p set:html=\`this string contains some <strong>HTML!!!</strong>\`></p>
	   ~~~~~~~~
	   Avoid using \`set:html\`. Astro does not escape its value.
</div>
`,
		},
	],
	valid: [
		`
---
let string = 'this string contains some <strong>HTML!!!</strong>'
---

<p set:text={string}></p>
		`,
		"<p set:text=`this string contains some <strong>HTML!!!</strong>`></p>",
		`
---
let string = 'this string contains some <strong>HTML!!!</strong>'
---

<p>{string}</p>
		`,
		"<p>{`this string contains some <strong>HTML!!!</strong>`}</p>",
	],
});
