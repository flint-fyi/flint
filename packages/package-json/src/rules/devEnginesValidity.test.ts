import { directPropertyValidityRules } from "../directPropertyValidityRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.devEnginesValidity, {
	invalid: [
		{
			code: `
{
  "devEngines": null
}
`,
			snapshot: `
{
  "devEngines": null
                ~~~~
                Invalid devEngines: the value is \`null\`, but should be an \`object\`.
}
`,
		},
		{
			code: `
{
  "devEngines": 123
}
`,
			snapshot: `
{
  "devEngines": 123
                ~~~
                Invalid devEngines: the value should be an \`object\`, not \`number\`.
}
`,
		},
		{
			code: `
{
  "devEngines": {
    "other": true
  }
}
`,
			snapshot: `
{
  "devEngines": {
    "other": true
             ~~~~
             Invalid devEngines: unexpected property \`other\`; only the following properties are allowed: cpu, libc, os, packageManager, runtime.
  }
}
`,
		},
		{
			code: `
{
  "devEngines": {
    "runtime": null
  }
}
`,
			snapshot: `
{
  "devEngines": {
    "runtime": null
               ~~~~
               Invalid devEngines: the value is \`null\`, but should be an object with at least \`name\` and optionally \`version\` and \`onFail\`.
  }
}
`,
		},
		{
			code: `
{
  "devEngines": {
    "runtime": {}
  }
}
`,
			snapshot: `
{
  "devEngines": {
    "runtime": {}
               ~~
               Invalid devEngines: missing required property \`name\` in devEngine object.
  }
}
`,
		},
		{
			code: `
{
  "devEngines": {
    "runtime": {
      "name": 123,
      "version": "",
      "onFail": "kaboom",
      "extra": true
    }
  }
}
`,
			snapshot: `
{
  "devEngines": {
    "runtime": {
      "name": 123,
              ~~~
              Invalid devEngines: the \`name\` property should be a string, but got \`number\`.
      "version": "",
                 ~~
                 Invalid devEngines: the \`version\` property should not be empty.
      "onFail": "kaboom",
                ~~~~~~~~
                Invalid devEngines: the \`onFail\` property should be one of the following values: warn, error, ignore, download.
      "extra": true
               ~~~~
               Invalid devEngines: unexpected property \`extra\`; only \`name\`, \`version\`, and \`onFail\` are allowed in a devEngine object.
    }
  }
}
`,
		},
		{
			code: `
{
  "devEngines": {
    "runtime": [
      {
        "name": "node",
        "onFail": []
      }
    ]
  }
}
`,
			snapshot: `
{
  "devEngines": {
    "runtime": [
      {
        "name": "node",
        "onFail": []
                  ~~
                  Invalid devEngines: the \`onFail\` property should be a string, but got \`Array\`.
      }
    ]
  }
}
`,
		},
	],
	valid: [
		`{}`,
		`{
  "devEngines": {
    "runtime": {
      "name": "node",
      "version": "^20.19.0 || >=22.12.0",
      "onFail": "download"
    }
  }
}`,
		`{
  "devEngines": {
    "packageManager": {
      "name": "pnpm",
      "version": "^10.0.0",
      "onFail": "error"
    }
  }
}`,
		`{
  "devEngines": {
    "runtime": [
      {
        "name": "node"
      },
      {
        "name": "bun",
        "onFail": "warn"
      }
    ]
  }
}`,
	],
});
