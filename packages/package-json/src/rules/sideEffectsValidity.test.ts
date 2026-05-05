import { directPropertyValidityRules } from "../directPropertyValidityRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.sideEffectsValidity, {
	invalid: [
		{
			code: `
{
  "sideEffects": null
}
`,
			snapshot: `
{
  "sideEffects": null
                 ~~~~
                 Invalid sideEffects: the value is \`null\`, but should be a \`boolean\` or an \`Array\`.
}
`,
		},
		{
			code: `
{
  "sideEffects": 123
}
`,
			snapshot: `
{
  "sideEffects": 123
                 ~~~
                 Invalid sideEffects: the type should be \`boolean\` or \`Array\`, not \`number\`.
}
`,
		},
		{
			code: `
{
  "sideEffects": "invalid"
}
`,
			snapshot: `
{
  "sideEffects": "invalid"
                 ~~~~~~~~~
                 Invalid sideEffects: the type should be \`boolean\` or \`Array\`, not \`string\`.
}
`,
		},
		{
			code: `
{
  "sideEffects": {}
}
`,
			snapshot: `
{
  "sideEffects": {}
                 ~~
                 Invalid sideEffects: the type should be \`boolean\` or \`Array\`, not \`object\`.
}
`,
		},
		{
			code: `
{
  "sideEffects": {
    "invalid-bin": 123
  }
}
`,
			snapshot: `
{
  "sideEffects": {
                 ~
                 Invalid sideEffects: the type should be \`boolean\` or \`Array\`, not \`object\`.
    "invalid-bin": 123
    ~~~~~~~~~~~~~~~~~~
  }
  ~
}
`,
		},
		{
			code: `
{
  "sideEffects": ["valid", "", 123, null]
}
`,
			snapshot: `
{
  "sideEffects": ["valid", "", 123, null]
                           ~~
                           Invalid sideEffects: item at index 1 is empty, but should be a path to a file with side effects or a glob pattern.
                               ~~~
                               Invalid sideEffects: item at index 2 should be a string, not \`number\`.
                                    ~~~~
                                    Invalid sideEffects: item at index 3 should be a string, not \`null\`.
}
`,
		},
	],
	valid: [
		`{}`,
		`
{
  "sideEffects": true
}
`,
		`
{
  "sideEffects": false
}
`,
		`
{
  "sideEffects": []
}
`,
		`
{
  "sideEffects": ["example-one", "example-two"]
}
`,
	],
});
