import rule from "./regexSetOperationOptimizations.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: String.raw`
/[a&&[^b]]/v;
`,
			output: String.raw`
/[a--[b]]/v;
`,
			snapshot: String.raw`
/[a&&[^b]]/v;
~~~~~~~~~~~~
This intersection can be converted to a subtraction using De Morgan's laws.
`,
		},
		{
			code: String.raw`
/[a&&b&&[^c]]/v;
`,
			output: String.raw`
/[[a&&b]--[c]]/v;
`,
			snapshot: String.raw`
/[a&&b&&[^c]]/v;
~~~~~~~~~~~~~~~
This intersection can be converted to a subtraction using De Morgan's laws.
`,
		},
		{
			code: String.raw`
/[a&&[^b]&&c]/v;
`,
			output: String.raw`
/[[a&&c]--[b]]/v;
`,
			snapshot: String.raw`
/[a&&[^b]&&c]/v;
~~~~~~~~~~~~~~~
This intersection can be converted to a subtraction using De Morgan's laws.
`,
		},
		{
			code: String.raw`
/[a&&b&&[^c]&&d]/v;
`,
			output: String.raw`
/[[a&&b&&d]--[c]]/v;
`,
			snapshot: String.raw`
/[a&&b&&[^c]&&d]/v;
~~~~~~~~~~~~~~~~~~
This intersection can be converted to a subtraction using De Morgan's laws.
`,
		},
		{
			code: String.raw`
/[[^a]&&b&&c]/v;
`,
			output: String.raw`
/[[b&&c]--[a]]/v;
`,
			snapshot: String.raw`
/[[^a]&&b&&c]/v;
~~~~~~~~~~~~~~~
This intersection can be converted to a subtraction using De Morgan's laws.
`,
		},
		{
			code: String.raw`
/[[^b]&&a]/v;
`,
			output: String.raw`
/[a--[b]]/v;
`,
			snapshot: String.raw`
/[[^b]&&a]/v;
~~~~~~~~~~~~
This intersection can be converted to a subtraction using De Morgan's laws.
`,
		},
		{
			code: String.raw`
/[[abc]&&[^def]]/v;
`,
			output: String.raw`
/[[abc]--[def]]/v;
`,
			snapshot: String.raw`
/[[abc]&&[^def]]/v;
~~~~~~~~~~~~~~~~~~
This intersection can be converted to a subtraction using De Morgan's laws.
`,
		},
		{
			code: String.raw`
/[a--[^b]]/v;
`,
			output: String.raw`
/[a&&[b]]/v;
`,
			snapshot: String.raw`
/[a--[^b]]/v;
~~~~~~~~~~~~
This subtraction can be converted to an intersection using De Morgan's laws.
`,
		},
		{
			code: String.raw`
/[a--[^b]--c]/v;
`,
			output: String.raw`
/[[a&&[b]]--c]/v;
`,
			snapshot: String.raw`
/[a--[^b]--c]/v;
~~~~~~~~~~~~~~~
This subtraction can be converted to an intersection using De Morgan's laws.
`,
		},
		{
			code: String.raw`
/[a--b--[^c]]/v;
`,
			output: String.raw`
/[[a--b]&&[c]]/v;
`,
			snapshot: String.raw`
/[a--b--[^c]]/v;
~~~~~~~~~~~~~~~
This subtraction can be converted to an intersection using De Morgan's laws.
`,
		},
		{
			code: String.raw`
/[[abc]--[^def]]/v;
`,
			output: String.raw`
/[[abc]&&[def]]/v;
`,
			snapshot: String.raw`
/[[abc]--[^def]]/v;
~~~~~~~~~~~~~~~~~~
This subtraction can be converted to an intersection using De Morgan's laws.
`,
		},
		{
			code: String.raw`
/[[^a]&&[^b]]/v;
`,
			output: String.raw`
/[^[a][b]]/v;
`,
			snapshot: String.raw`
/[[^a]&&[^b]]/v;
~~~~~~~~~~~~~~~
This character class can be converted to a negated disjunction using De Morgan's laws.
`,
		},
		{
			code: String.raw`
/[^[^a]&&[^b]]/v;
`,
			output: String.raw`
/[[a][b]]/v;
`,
			snapshot: String.raw`
/[^[^a]&&[^b]]/v;
~~~~~~~~~~~~~~~~
This character class can be converted to a negated disjunction using De Morgan's laws.
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
This character class can be converted to a negated disjunction using De Morgan's laws.
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
This character class can be converted to a negated disjunction using De Morgan's laws.
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
This expression can be converted to a negated disjunction using De Morgan's laws.
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
This character class can be converted to a negated disjunction using De Morgan's laws.
`,
		},
		{
			code: String.raw`
/[[^a]&&[b]&&[^c]]/v;
`,
			output: String.raw`
/[[^[a][c]]&&[b]]/v;
`,
			snapshot: String.raw`
/[[^a]&&[b]&&[^c]]/v;
~~~~~~~~~~~~~~~~~~~~
This expression can be converted to a negated disjunction using De Morgan's laws.
`,
		},
		{
			code: String.raw`
/[[^a][^b]]/v;
`,
			output: String.raw`
/[^[a]&&[b]]/v;
`,
			snapshot: String.raw`
/[[^a][^b]]/v;
~~~~~~~~~~~~~
This character class can be converted to a negated conjunction using De Morgan's laws.
`,
		},
		{
			code: String.raw`
/[[^abc][^def]]/v;
`,
			output: String.raw`
/[^[abc]&&[def]]/v;
`,
			snapshot: String.raw`
/[[^abc][^def]]/v;
~~~~~~~~~~~~~~~~~
This character class can be converted to a negated conjunction using De Morgan's laws.
`,
		},
		{
			code: String.raw`
/[^[^a][^b]]/v;
`,
			output: String.raw`
/[[a]&&[b]]/v;
`,
			snapshot: String.raw`
/[^[^a][^b]]/v;
~~~~~~~~~~~~~~
This character class can be converted to a negated conjunction using De Morgan's laws.
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
This character class can be converted to a negated conjunction using De Morgan's laws.
`,
		},
		{
			code: String.raw`
/[a&&[^b]&&[^c]&&d]/v;
`,
			output: String.raw`
/[[^[b][c]]&&a&&d]/v;
`,
			snapshot: String.raw`
/[a&&[^b]&&[^c]&&d]/v;
~~~~~~~~~~~~~~~~~~~~~
This expression can be converted to a negated disjunction using De Morgan's laws.
`,
		},
		{
			code: String.raw`
/[[^bc]&&a&&d]/v;
`,
			output: String.raw`
/[[a&&d]--[bc]]/v;
`,
			snapshot: String.raw`
/[[^bc]&&a&&d]/v;
~~~~~~~~~~~~~~~~
This intersection can be converted to a subtraction using De Morgan's laws.
`,
		},
	],
	valid: [
		String.raw`/[[abc]]/v`,
		String.raw`/[\d]/u`,
		String.raw`/[^\d]/v`,
		String.raw`/[a--b]/v`,
		String.raw`/[a&&b]/v`,
		String.raw`/[^ab]/v`,
		String.raw`/[^a&&b]/v;`,
		String.raw`/[\s\p{ASCII}]/u`,
		String.raw`/[^\S\P{ASCII}]/u`,
		String.raw`/[^[]]/v`,
		String.raw`/[a&&b&&[c]]/v`,
		String.raw`/[a--b--[c]]/v`,
		String.raw`/[a]/v`,
		String.raw`/[abc]/v`,
		String.raw`/[\w]/v`,
		String.raw`/[^a]/v`,
		String.raw`/[a&&[^b]]/u`,
		String.raw`/test/v`,
		String.raw`/[a&&b]/v`,
		String.raw`/[a--b]/v`,
		String.raw`/[a[^b]]/v`,
	],
});
