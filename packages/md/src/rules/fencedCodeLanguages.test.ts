import rule from "./fencedCodeLanguages.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
\`\`\`
const message = "Hello, world!";
console.log(message);
\`\`\`
`,
			snapshot: `
\`\`\`
~~~
This fenced code block's language is ambiguous.
const message = "Hello, world!";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
console.log(message);
~~~~~~~~~~~~~~~~~~~~~
\`\`\`
~~~
`,
		},
		{
			code: `
Some text.

\`\`\`
plain text here
\`\`\`
`,
			snapshot: `
Some text.

\`\`\`
~~~
This fenced code block's language is ambiguous.
plain text here
~~~~~~~~~~~~~~~
\`\`\`
~~~
`,
		},
		{
			code: `
# Heading

\`\`\`
code without language
\`\`\`

More content.
`,
			snapshot: `
# Heading

\`\`\`
~~~
This fenced code block's language is ambiguous.
code without language
~~~~~~~~~~~~~~~~~~~~~
\`\`\`
~~~

More content.
`,
		},
		{
			code: `
\`\`\`
first block
\`\`\`

\`\`\`
second block
\`\`\`
`,
			snapshot: `
\`\`\`
~~~
This fenced code block's language is ambiguous.
first block
~~~~~~~~~~~
\`\`\`
~~~

\`\`\`
~~~
This fenced code block's language is ambiguous.
second block
~~~~~~~~~~~~
\`\`\`
~~~
`,
		},
	],
	valid: [
		`
\`\`\`js
const message = "Hello, world!";
console.log(message);
\`\`\`
`,
		`
\`\`\`javascript
const message = "Hello, world!";
console.log(message);
\`\`\`
`,
		`
\`\`\`text
plain text here
\`\`\`
`,
		`
\`\`\`python
def greet():
    print("Hello, world!")
\`\`\`
`,
		`
# Heading

\`\`\`typescript
const value: string = "test";
\`\`\`

More content.
`,
		`
Multiple blocks:

\`\`\`html
<div>Hello</div>
\`\`\`

\`\`\`css
.class { color: red; }
\`\`\`
`,
	],
});
