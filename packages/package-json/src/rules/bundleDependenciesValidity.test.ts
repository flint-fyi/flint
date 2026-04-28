import { directPropertyValidityRules } from "../directPropertyValidityRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.bundleDependenciesValidity, {
	invalid: [
		{
			code: `
{
  "bundleDependencies": null
}
`,
			snapshot: `
{
  "bundleDependencies": null
                        ~~~~
                        Invalid bundleDependencies: the value is \`null\`, but should be an \`Array\` or a \`boolean\`.
}
`,
		},
		{
			code: `
{
  "bundleDependencies": 123
}
`,
			snapshot: `
{
  "bundleDependencies": 123
                        ~~~
                        Invalid bundleDependencies: the type should be \`Array\` or \`boolean\`, not \`number\`.
}
`,
		},
		{
			code: `
{
  "bundleDependencies": "invalid"
}
`,
			snapshot: `
{
  "bundleDependencies": "invalid"
                        ~~~~~~~~~
                        Invalid bundleDependencies: the type should be \`Array\` or \`boolean\`, not \`string\`.
}
`,
		},
		{
			code: `
{
  "bundleDependencies": {
    "invalid-bin": 123
  }
}
`,
			snapshot: `
{
  "bundleDependencies": {
                        ~
                        Invalid bundleDependencies: the type should be \`Array\` or \`boolean\`, not \`object\`.
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
  "bundleDependencies": {}
}
`,
			snapshot: `
{
  "bundleDependencies": {}
                        ~~
                        Invalid bundleDependencies: the type should be \`Array\` or \`boolean\`, not \`object\`.
}
`,
		},
		{
			code: `
{
  "bundleDependencies": [
    "valid",
    "",
    123,
    null
  ]
}
`,
			snapshot: `
{
  "bundleDependencies": [
    "valid",
    "",
    ~~
    Invalid bundleDependencies: item at index 1 is empty, but should be a dependency name.
    123,
    ~~~
    Invalid bundleDependencies: item at index 2 should be a string, not \`number\`.
    null
    ~~~~
    Invalid bundleDependencies: item at index 3 should be a string, not \`null\`.
  ]
}
`,
		},
		{
			code: `
{
  "bundledDependencies": null
}
`,
			snapshot: `
{
  "bundledDependencies": null
                         ~~~~
                         Invalid bundleDependencies: the value is \`null\`, but should be an \`Array\` or a \`boolean\`.
}
`,
		},
		{
			code: `
{
  "bundledDependencies": 123
}
`,
			snapshot: `
{
  "bundledDependencies": 123
                         ~~~
                         Invalid bundleDependencies: the type should be \`Array\` or \`boolean\`, not \`number\`.
}
`,
		},
		{
			code: `
{
  "bundledDependencies": "invalid"
}
`,
			snapshot: `
{
  "bundledDependencies": "invalid"
                         ~~~~~~~~~
                         Invalid bundleDependencies: the type should be \`Array\` or \`boolean\`, not \`string\`.
}
`,
		},
		{
			code: `
{
  "bundledDependencies": {
    "invalid-bin": 123
  }
}
`,
			snapshot: `
{
  "bundledDependencies": {
                         ~
                         Invalid bundleDependencies: the type should be \`Array\` or \`boolean\`, not \`object\`.
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
  "bundledDependencies": {}
}
`,
			snapshot: `
{
  "bundledDependencies": {}
                         ~~
                         Invalid bundleDependencies: the type should be \`Array\` or \`boolean\`, not \`object\`.
}
`,
		},
		{
			code: `
{
  "bundledDependencies": [
    "valid",
    "",
    123,
    null
  ]
}
`,
			snapshot: `
{
  "bundledDependencies": [
    "valid",
    "",
    ~~
    Invalid bundleDependencies: item at index 1 is empty, but should be a dependency name.
    123,
    ~~~
    Invalid bundleDependencies: item at index 2 should be a string, not \`number\`.
    null
    ~~~~
    Invalid bundleDependencies: item at index 3 should be a string, not \`null\`.
  ]
}
`,
		},
	],
	valid: [
		`{}`,
		`{
  "bundleDependencies": []
}`,
		`{
  "bundleDependencies": ["first", "second"]
}`,
		`{
  "bundleDependencies": true
}`,
		`{
  "bundleDependencies": false
}`,
		`{
  "bundledDependencies": true
}`,
		`{
  "bundledDependencies": false
}`,
		`{
  "bundledDependencies": []
}`,
		`{
  "bundledDependencies": ["first", "second"]
}`,
	],
});
