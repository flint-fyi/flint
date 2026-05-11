import { ruleTester } from "../ruleTester.ts";
import rule from "./repositoryShorthand.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
{
	"repository": ""
}
`,
			snapshot: `
{
	"repository": ""
	              ~~
	              Repository string shorthand values are no longer considered valid by npm.
}
`,
		},
		{
			code: `
{
	"repository": "invalid"
}
`,
			snapshot: `
{
	"repository": "invalid"
	              ~~~~~~~~~
	              Repository string shorthand values are no longer considered valid by npm.
}
`,
		},
		{
			code: `
{
	"repository": "invalid/"
}
`,
			snapshot: `
{
	"repository": "invalid/"
	              ~~~~~~~~~~
	              Repository string shorthand values are no longer considered valid by npm.
}
`,
		},
		{
			code: `
{
	"repository": "flint-fyi/flint"
}
`,
			output: `
{
	"repository": {"type":"git","url":"https://github.com/flint-fyi/flint"}
}
`,
			snapshot: `
{
	"repository": "flint-fyi/flint"
	              ~~~~~~~~~~~~~~~~~
	              Repository string shorthand values are no longer considered valid by npm.
}
`,
		},
		{
			code: `
{
	"repository": "github:flint-fyi/flint"
}
`,
			output: `
{
	"repository": {"type":"git","url":"https://github.com/flint-fyi/flint"}
}
`,
			snapshot: `
{
	"repository": "github:flint-fyi/flint"
	              ~~~~~~~~~~~~~~~~~~~~~~~~
	              Repository string shorthand values are no longer considered valid by npm.
}
`,
		},
		{
			code: `
{
	"repository": "gibberish:flint-fyi/flint"
}
`,
			snapshot: `
{
	"repository": "gibberish:flint-fyi/flint"
	              ~~~~~~~~~~~~~~~~~~~~~~~~~~~
	              Repository string shorthand values are no longer considered valid by npm.
}
`,
		},
	],
	valid: [
		`{ "repository": null }`,
		`{ "repository": 123 }`,
		`{
	"repository": {
		"type": "git"
	}
}`,
		`{
	"repository": {
		"url": "https://github.com/flint-fyi/flint"
	}
}`,
		`{
	"repository": {
		"type": "git",
		"url": "https://github.com/flint-fyi/flint"
	}
}`,
		`{
	"repository": {
		"type": "git",
		"url": "https://gist.github.com/flint-fyi/1234567890abcdef"
	}
}`,
		`{
	"repository": {
		"type": "git",
		"url": "https://bitbucket.org/flint-fyi/flint"
	}
}`,
		`{
	"repository": {
		"type": "git",
		"url": "https://gitlab.com/flint-fyi/flint"
	}
}`,
	],
});
