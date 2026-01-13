import rule from "./headingRootDuplicates.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
# Heading 1

# Another H1 heading
`,
			snapshot: `
# Heading 1

# Another H1 heading
~~~~~~~~~~~~~~~~~~~~
This element is an invalid additional H1 heading after the document's first.
`,
		},
		{
			code: `
<h1>First Heading</h1>

<h1>Second Heading</h1>
`,
			snapshot: `
<h1>First Heading</h1>

<h1>Second Heading</h1>
~~~~~~~~~~~~~~~~~~~~~~~
This element is an invalid additional H1 heading after the document's first.
`,
		},
		{
			code: `
# First H1

## H2 Section

# Second H1
`,
			snapshot: `
# First H1

## H2 Section

# Second H1
~~~~~~~~~~~
This element is an invalid additional H1 heading after the document's first.
`,
		},
		{
			code: `
# Markdown H1

<h1>HTML H1</h1>
`,
			snapshot: `
# Markdown H1

<h1>HTML H1</h1>
~~~~~~~~~~~~~~~~
This element is an invalid additional H1 heading after the document's first.
`,
		},
	],
	valid: [
		`
# Single Heading

Content here.
`,
		`
# Main Heading

## Subsection

### Deeper Section
`,
		`
<h1>Single HTML Heading</h1>

Content here.
`,
		`
## H2 Heading

Content without any H1.
`,
		`
# Single Heading

## Multiple H2s

## Are fine

### And H3s too
`,
	],
});
