import rule from "./elementChildrenValidity.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
<br>text</br>
`,
			snapshot: `
<br>text</br>
 ~~
 The \`<br>\` element is a void element and cannot have children.
`,
		},
		{
			code: `
<img>child content</img>
`,
			snapshot: `
<img>child content</img>
 ~~~
 The \`<img>\` element is a void element and cannot have children.
`,
		},
		{
			code: `
<input><span>Invalid</span></input>
`,
			snapshot: `
<input><span>Invalid</span></input>
 ~~~~~
 The \`<input>\` element is a void element and cannot have children.
`,
		},
		{
			code: `
<hr>{expression}</hr>
`,
			snapshot: `
<hr>{expression}</hr>
 ~~
 The \`<hr>\` element is a void element and cannot have children.
`,
		},
		{
			code: `
<meta>
    <div>Content</div>
</meta>
`,
			snapshot: `
<meta>
 ~~~~
 The \`<meta>\` element is a void element and cannot have children.
    <div>Content</div>
</meta>
`,
		},
		{
			code: `
<area>text content</area>
`,
			snapshot: `
<area>text content</area>
 ~~~~
 The \`<area>\` element is a void element and cannot have children.
`,
		},
		{
			code: `
<base>
    content
</base>
`,
			snapshot: `
<base>
 ~~~~
 The \`<base>\` element is a void element and cannot have children.
    content
</base>
`,
		},
		{
			code: `
<col><td>data</td></col>
`,
			snapshot: `
<col><td>data</td></col>
 ~~~
 The \`<col>\` element is a void element and cannot have children.
`,
		},
		{
			code: `
<embed>child</embed>
`,
			snapshot: `
<embed>child</embed>
 ~~~~~
 The \`<embed>\` element is a void element and cannot have children.
`,
		},
		{
			code: `
<link>content</link>
`,
			snapshot: `
<link>content</link>
 ~~~~
 The \`<link>\` element is a void element and cannot have children.
`,
		},
		{
			code: `
<param>value</param>
`,
			snapshot: `
<param>value</param>
 ~~~~~
 The \`<param>\` element is a void element and cannot have children.
`,
		},
		{
			code: `
<source>media</source>
`,
			snapshot: `
<source>media</source>
 ~~~~~~
 The \`<source>\` element is a void element and cannot have children.
`,
		},
		{
			code: `
<track>subtitle</track>
`,
			snapshot: `
<track>subtitle</track>
 ~~~~~
 The \`<track>\` element is a void element and cannot have children.
`,
		},
		{
			code: `
<wbr>text</wbr>
`,
			snapshot: `
<wbr>text</wbr>
 ~~~
 The \`<wbr>\` element is a void element and cannot have children.
`,
		},
	],
	valid: [
		`<br />`,
		`<img src="test.jpg" />`,
		`<input type="text" />`,
		`<hr />`,
		`<meta name="viewport" />`,
		`<link rel="stylesheet" />`,
		`<div>Content</div>`,
		`<span><br /></span>`,
		`<CustomComponent>children</CustomComponent>`,
		`<Button>Click me</Button>`,
		`<area />`,
		`<base />`,
		`<col />`,
		`<embed />`,
		`<param />`,
		`<source />`,
		`<track />`,
		`<wbr />`,
	],
});
