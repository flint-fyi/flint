import { directPropertyValidityRules } from "../directPropertyValidityRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.bugsValidity, {
	invalid: [
		{
			code: `
{
  "bugs": null
}
`,
			snapshot: `
{
  "bugs": null
          ~~~~
          Invalid bugs: the value should be either a string URL or an object with \`email\` and / or \`url\` properties.
}
`,
		},
		{
			code: `
{
  "bugs": 123
}
`,
			snapshot: `
{
  "bugs": 123
          ~~~
          Invalid bugs: the value should be either a string URL or an object with \`email\` and / or \`url\` properties.
}
`,
		},
		{
			code: `
{
  "bugs": "not-a-url"
}
`,
			snapshot: `
{
  "bugs": "not-a-url"
          ~~~~~~~~~~~
          Invalid bugs: the value should be a URL.
}
`,
		},
		{
			code: `
{
  "bugs": {}
}
`,
			snapshot: `
{
  "bugs": {}
          ~~
          Invalid bugs: the object should have at least one of these properties: email, url.
}
`,
		},
		{
			code: `
{
  "bugs": {
    "email": 123
  }
}
`,
			snapshot: `
{
  "bugs": {
    "email": 123
             ~~~
             Invalid bugs: the value of \`email\` should be a string.
  }
}
`,
		},
		{
			code: `
{
  "bugs": {
    "url": "not-a-url"
  }
}
`,
			snapshot: `
{
  "bugs": {
    "url": "not-a-url"
           ~~~~~~~~~~~
           Invalid bugs: the value of \`url\` should be a valid URL.
  }
}
`,
		},
		{
			code: `
{
  "bugs": {
    "extra": true,
    "email": "name@example.com"
  }
}
`,
			snapshot: `
{
  "bugs": {
    "extra": true,
             ~~~~
             Invalid bugs: unexpected property "extra". Only "email" and "url" are allowed.
    "email": "name@example.com"
  }
}
`,
		},
	],
	valid: [
		`{}`,
		`{
  "bugs": "https://example.com/issues"
}`,
		`{
  "bugs": {
    "email": "name@example.com"
  }
}`,
		`{
  "bugs": {
    "url": "https://example.com/issues"
  }
}`,
		`{
  "bugs": {
    "email": "name@example.com",
    "url": "https://example.com/issues"
  }
}`,
	],
});
