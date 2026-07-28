import rule from "./regexSetOperationOptimizations.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/[a&&[^b]]/v;
`,
			output: `
/[a--[b]]/v;
`,
			snapshot: `
/[a&&[^b]]/v;
~~~~~~~~~~~~
This intersection can be simplified to a subtraction.
`,
		},
		{
			code: `
/[a&&b&&[^c]]/v;
`,
			output: `
/[[a&&b]--[c]]/v;
`,
			snapshot: `
/[a&&b&&[^c]]/v;
~~~~~~~~~~~~~~~
This intersection can be simplified to a subtraction.
`,
		},
		{
			code: `
/[a&&[^b]&&c]/v;
`,
			output: `
/[[a&&c]--[b]]/v;
`,
			snapshot: `
/[a&&[^b]&&c]/v;
~~~~~~~~~~~~~~~
This intersection can be simplified to a subtraction.
`,
		},
		{
			code: `
/[a&&b&&[^c]&&d]/v;
`,
			output: `
/[[a&&b&&d]--[c]]/v;
`,
			snapshot: `
/[a&&b&&[^c]&&d]/v;
~~~~~~~~~~~~~~~~~~
This intersection can be simplified to a subtraction.
`,
		},
		{
			code: `
/[[^a]&&b&&c]/v;
`,
			output: `
/[[b&&c]--[a]]/v;
`,
			snapshot: `
/[[^a]&&b&&c]/v;
~~~~~~~~~~~~~~~
This intersection can be simplified to a subtraction.
`,
		},
		{
			code: `
/[[^b]&&a]/v;
`,
			output: `
/[a--[b]]/v;
`,
			snapshot: `
/[[^b]&&a]/v;
~~~~~~~~~~~~
This intersection can be simplified to a subtraction.
`,
		},
		{
			code: `
/[[abc]&&[^def]]/v;
`,
			output: `
/[[abc]--[def]]/v;
`,
			snapshot: `
/[[abc]&&[^def]]/v;
~~~~~~~~~~~~~~~~~~
This intersection can be simplified to a subtraction.
`,
		},
		{
			code: `
/[a--[^b]]/v;
`,
			output: `
/[a&&[b]]/v;
`,
			snapshot: `
/[a--[^b]]/v;
~~~~~~~~~~~~
This subtraction can be simplified to an intersection.
`,
		},
		{
			code: `
/[a--[^b]--c]/v;
`,
			output: `
/[[a&&[b]]--c]/v;
`,
			snapshot: `
/[a--[^b]--c]/v;
~~~~~~~~~~~~~~~
This subtraction can be simplified to an intersection.
`,
		},
		{
			code: `
/[a--b--[^c]]/v;
`,
			output: `
/[[a--b]&&[c]]/v;
`,
			snapshot: `
/[a--b--[^c]]/v;
~~~~~~~~~~~~~~~
This subtraction can be simplified to an intersection.
`,
		},
		{
			code: `
/[[abc]--[^def]]/v;
`,
			output: `
/[[abc]&&[def]]/v;
`,
			snapshot: `
/[[abc]--[^def]]/v;
~~~~~~~~~~~~~~~~~~
This subtraction can be simplified to an intersection.
`,
		},
		{
			code: `
/[[^a]&&[^b]]/v;
`,
			output: `
/[^[a][b]]/v;
`,
			snapshot: `
/[[^a]&&[^b]]/v;
~~~~~~~~~~~~~~~
This character class can be simplified to a negated disjunction.
`,
		},
		{
			code: `
/[^[^a]&&[^b]]/v;
`,
			output: `
/[[a][b]]/v;
`,
			snapshot: `
/[^[^a]&&[^b]]/v;
~~~~~~~~~~~~~~~~
This character class can be simplified to a negated disjunction.
`,
		},
		{
			code: String.raw`
/[[^a]&&[^b]&&\D]/v;
`,
			output: String.raw`
/[^[a][b]\d]/v;
`,
			snapshot: String.raw`
/[[^a]&&[^b]&&\D]/v;
~~~~~~~~~~~~~~~~~~~
This character class can be simplified to a negated disjunction.
`,
		},
		{
			code: String.raw`
/[^[^a]&&[^b]&&\D]/v;
`,
			output: String.raw`
/[[a][b]\d]/v;
`,
			snapshot: String.raw`
/[^[^a]&&[^b]&&\D]/v;
~~~~~~~~~~~~~~~~~~~~
This character class can be simplified to a negated disjunction.
`,
		},
		{
			code: String.raw`
/[[^a]&&\D&&b]/v;
`,
			output: String.raw`
/[[^[a]\d]&&b]/v;
`,
			snapshot: String.raw`
/[[^a]&&\D&&b]/v;
~~~~~~~~~~~~~~~~
This expression can be simplified to a negated disjunction.
`,
		},
		{
			code: String.raw`
/[[^abc]&&[^def]&&\D]/v;
`,
			output: String.raw`
/[^[abc][def]\d]/v;
`,
			snapshot: String.raw`
/[[^abc]&&[^def]&&\D]/v;
~~~~~~~~~~~~~~~~~~~~~~~
This character class can be simplified to a negated disjunction.
`,
		},
		{
			code: `
/[[^a]&&[b]&&[^c]]/v;
`,
			output: `
/[[^[a][c]]&&[b]]/v;
`,
			snapshot: `
/[[^a]&&[b]&&[^c]]/v;
~~~~~~~~~~~~~~~~~~~~
This expression can be simplified to a negated disjunction.
`,
		},
		{
			code: `
/[[^a][^b]]/v;
`,
			output: `
/[^[a]&&[b]]/v;
`,
			snapshot: `
/[[^a][^b]]/v;
~~~~~~~~~~~~~
This character class can be simplified to a negated conjunction.
`,
		},
		{
			code: `
/[[^abc][^def]]/v;
`,
			output: `
/[^[abc]&&[def]]/v;
`,
			snapshot: `
/[[^abc][^def]]/v;
~~~~~~~~~~~~~~~~~
This character class can be simplified to a negated conjunction.
`,
		},
		{
			code: `
/[^[^a][^b]]/v;
`,
			output: `
/[[a]&&[b]]/v;
`,
			snapshot: `
/[^[^a][^b]]/v;
~~~~~~~~~~~~~~
This character class can be simplified to a negated conjunction.
`,
		},
		{
			code: String.raw`
/[^\S\P{ASCII}]/v;
`,
			output: String.raw`
/[\s&&\p{ASCII}]/v;
`,
			snapshot: String.raw`
/[^\S\P{ASCII}]/v;
~~~~~~~~~~~~~~~~~
This character class can be simplified to a negated conjunction.
`,
		},
		{
			code: `
/[a&&[^b]&&[^c]&&d]/v;
`,
			output: `
/[[^[b][c]]&&a&&d]/v;
`,
			snapshot: `
/[a&&[^b]&&[^c]&&d]/v;
~~~~~~~~~~~~~~~~~~~~~
This expression can be simplified to a negated disjunction.
`,
		},
		{
			code: `
/[[^bc]&&a&&d]/v;
`,
			output: `
/[[a&&d]--[bc]]/v;
`,
			snapshot: `
/[[^bc]&&a&&d]/v;
~~~~~~~~~~~~~~~~
This intersection can be simplified to a subtraction.
`,
		},
	],
	valid: [
		"/[[abc]]/v",
		String.raw`/[\d]/u`,
		String.raw`/[^\d]/v`,
		"/[a--b]/v",
		"/[a&&b]/v",
		"/[^ab]/v",
		"/[^a&&b]/v;",
		String.raw`/[\s\p{ASCII}]/u`,
		String.raw`/[^\S\P{ASCII}]/u`,
		"/[^[]]/v",
		"/[a&&b&&[c]]/v",
		"/[a--b--[c]]/v",
		"/[a]/v",
		"/[abc]/v",
		String.raw`/[\w]/v`,
		"/[^a]/v",
		"/[a&&[^b]]/u",
		"/test/v",
		"/[a[^b]]/v",
	],
});
