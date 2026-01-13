import rule from "./blockMappings.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
key: {nested: value}
`,
			output: `
key:
  nested: value
`,
			snapshot: `
key: {nested: value}
     ~~~~~~~~~~~~~~~
     Prefer block-style mappings over flow-style mappings for improved readability.
`,
		},
		{
			code: `
config: {: emptyKey}
`,
			snapshot: `
config: {: emptyKey}
        ~~~~~~~~~~~~
        Prefer block-style mappings over flow-style mappings for improved readability.
`,
		},
		{
			code: `
config: {emptyValue:}
`,
			snapshot: `
config: {emptyValue:}
        ~~~~~~~~~~~~~
        Prefer block-style mappings over flow-style mappings for improved readability.
`,
		},
		{
			code: `
outer: {inner: value, another: data}
`,
			output: `
outer:
  inner: value
  another: data
`,
			snapshot: `
outer: {inner: value, another: data}
       ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
       Prefer block-style mappings over flow-style mappings for improved readability.
`,
		},
		{
			code: `
parent:
    child: {nested: value}
`,
			output: `
parent:
    child:
      nested: value
`,
			snapshot: `
parent:
    child: {nested: value}
           ~~~~~~~~~~~~~~~
           Prefer block-style mappings over flow-style mappings for improved readability.
`,
		},
		{
			code: `
items:
    - {name: first}
    - {name: second}
`,
			output: `
items:
    -
      name: first
    -
      name: second
`,
			snapshot: `
items:
    - {name: first}
      ~~~~~~~~~~~~~
      Prefer block-style mappings over flow-style mappings for improved readability.
    - {name: second}
      ~~~~~~~~~~~~~~
      Prefer block-style mappings over flow-style mappings for improved readability.
`,
		},
		{
			code: `
nested: {outer: {inner: value}}
`,
			output: `
nested:
  outer: {inner: value}
`,
			snapshot: `
nested: {outer: {inner: value}}
        ~~~~~~~~~~~~~~~~~~~~~~~
        Prefer block-style mappings over flow-style mappings for improved readability.
                ~~~~~~~~~~~~~~
                Prefer block-style mappings over flow-style mappings for improved readability.
`,
		},
		{
			code: `
multiple: {first: 1, second: 2, third: 3}
`,
			output: `
multiple:
  first: 1
  second: 2
  third: 3
`,
			snapshot: `
multiple: {first: 1, second: 2, third: 3}
          ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          Prefer block-style mappings over flow-style mappings for improved readability.
`,
		},
		{
			code: `
data:
    level1:
        level2: {key: value}
`,
			output: `
data:
    level1:
        level2:
          key: value
`,
			snapshot: `
data:
    level1:
        level2: {key: value}
                ~~~~~~~~~~~~
                Prefer block-style mappings over flow-style mappings for improved readability.
`,
		},
	],
	valid: [
		`key: value`,
		`
key:
    nested: value
`,
		`
outer:
    inner: value
    another: data
`,
		`
parent:
    child:
        nested: value
`,
		`
items:
    - name: first
    - name: second
`,
		`
deeply:
    nested:
        structure:
            key: value
`,
		`
list:
    - item1
    - item2
    - item3
`,
	],
});
