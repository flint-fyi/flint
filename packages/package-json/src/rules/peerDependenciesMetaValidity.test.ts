import { directPropertyValidityRules } from "../directPropertyValidityRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.peerDependenciesMetaValidity, {
	invalid: [
		{
			code: `
{
  "peerDependenciesMeta": null
}
`,
			snapshot: `
{
  "peerDependenciesMeta": null
                          ~~~~
                          Invalid peerDependenciesMeta: the value is \`null\`, but should be an object with peer dependency metadata.
}
`,
		},
		{
			code: `
{
  "peerDependenciesMeta": 123
}
`,
			snapshot: `
{
  "peerDependenciesMeta": 123
                          ~~~
                          Invalid peerDependenciesMeta: the type should be \`object\`, not \`number\`.
}
`,
		},
		{
			code: `
{
  "peerDependenciesMeta": []
}
`,
			snapshot: `
{
  "peerDependenciesMeta": []
                          ~~
                          Invalid peerDependenciesMeta: the type should be \`object\`, not \`Array\`.
}
`,
		},
		{
			code: `
{
  "peerDependenciesMeta": {
    "package-a": null
  }
}
`,
			snapshot: `
{
  "peerDependenciesMeta": {
    "package-a": null
                 ~~~~
                 Invalid peerDependenciesMeta: the peer dependency metadata for \`package-a\` should be an object, not \`null\`.
  }
}
`,
		},
		{
			code: `
{
  "peerDependenciesMeta": {
    "package-a": {}
  }
}
`,
			snapshot: `
{
  "peerDependenciesMeta": {
    "package-a": {}
                 ~~
                 Invalid peerDependenciesMeta: the peer dependency metadata for \`package-a\` should contain the \`optional\` property.
  }
}
`,
		},
		{
			code: `
{
  "peerDependenciesMeta": {
    "package-a": {
      "optional": "yes"
    }
  }
}
`,
			snapshot: `
{
  "peerDependenciesMeta": {
    "package-a": {
      "optional": "yes"
                  ~~~~~
                  Invalid peerDependenciesMeta: the value should be a boolean, not \`string\`.
    }
  }
}
`,
		},
		{
			code: `
{
  "peerDependenciesMeta": {
    "package-a": {
      "optional": true,
      "other": 1
    }
  }
}
`,
			snapshot: `
{
  "peerDependenciesMeta": {
    "package-a": {
      "optional": true,
      "other": 1
               ~
               Invalid peerDependenciesMeta: unexpected property \`other\`; only \`optional\` is allowed in peer dependency metadata.
    }
  }
}
`,
		},
	],
	valid: [
		`{}`,
		`{
  "peerDependenciesMeta": {
    "package-a": {
      "optional": true
    }
  }
}`,
		`{
  "peerDependenciesMeta": {
    "package-a": {
      "optional": false
    },
    "package-b": {
      "optional": true
    }
  }
}`,
	],
});
