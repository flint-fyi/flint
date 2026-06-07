import { ruleTester } from "../ruleTester.ts";
import rule from "./publishConfigRedundancy.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
{
  "name": "my-package",
  "publishConfig": {
    "access": "public"
  }
}
`,
			snapshot: `
{
  "name": "my-package",
  "publishConfig": {
    "access": "public"
    ~~~~~~~~
    Unscoped packages are always published with public access, so this field has no effect.
  }
}
`,
			suggestions: [
				{
					id: "removeAccess",
					updated: `
{
  "name": "my-package",
  "publishConfig": {}
}
`,
				},
			],
		},
		{
			code: `
{
  "name": "my-package",
  "publishConfig": {
    "access": "restricted",
    "registry": "https://registry.npmjs.org/"
  }
}
`,
			snapshot: `
{
  "name": "my-package",
  "publishConfig": {
    "access": "restricted",
    ~~~~~~~~
    Unscoped packages are always published with public access, so this field has no effect.
    "registry": "https://registry.npmjs.org/"
  }
}
`,
			suggestions: [
				{
					id: "removeAccess",
					updated: `
{
  "name": "my-package",
  "publishConfig": {
    "registry": "https://registry.npmjs.org/"
  }
}
`,
				},
			],
		},
	],
	valid: [
		`{}`,
		`
{
  "name": "@scope/my-package",
  "publishConfig": {
    "access": "public"
  }
}
`,
		`
{
  "name": "@scope/my-package",
  "publishConfig": {
    "access": "restricted"
  }
}
`,
		`
{
  "name": "my-package",
  "publishConfig": {
    "registry": "https://registry.npmjs.org/"
  }
}
`,
		`
{
  "publishConfig": {
    "access": "public"
  }
}
`,
		`
{
  "name": 123,
  "publishConfig": {
    "access": "public"
  }
}
`,
		`
{
  "name": "my-package",
  "publishConfig": "public"
}
`,
	],
});
