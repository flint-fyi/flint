import { directPropertyValidityRules } from "./directPropertyValidityRules.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.osValidity, {
	invalid: [
		{
			code: `{
  "os": null
}`,
			snapshot: `{
  "os": null
        ~~~~
        Invalid os: the value is \`null\`, but should be an \`Array\` of strings.
}`,
		},
		{
			code: `{
  "os": 123
}`,
			snapshot: `{
  "os": 123
        ~~~
        Invalid os: the type should be \`Array\`, not \`number\`.
}`,
		},
		{
			code: `{
  "os": {}
}`,
			snapshot: `{
  "os": {}
        ~~
        Invalid os: the type should be \`Array\`, not \`object\`.
}`,
		},
	],
	valid: [
		{
			code: `{}`,
		},
		{
			code: `{
  "os": []
}`,
		},
		{
			code: `{
  "os": ["darwin", "linux"]
}`,
		},
	],
});
