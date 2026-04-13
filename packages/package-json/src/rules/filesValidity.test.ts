import { directPropertyValidityRules } from "./directPropertyValidityRules.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.filesValidity, {
	invalid: [
		{
			code: `{
  "files": null
}`,
			snapshot: `{
  "files": null
           ~~~~
           Invalid files: the value is \`null\`, but should be an \`Array\` of strings.
}`,
		},
		{
			code: `{
  "files": 123
}`,
			snapshot: `{
  "files": 123
           ~~~
           Invalid files: the type should be \`Array\`, not \`number\`.
}`,
		},
		{
			code: `{
  "files": {}
}`,
			snapshot: `{
  "files": {}
           ~~
           Invalid files: the type should be \`Array\`, not \`object\`.
}`,
		},
	],
	valid: [
		{
			code: `{}`,
		},
		{
			code: `{
  "files": []
}`,
		},
		{
			code: `{
  "files": ["dist", "lib"]
}`,
		},
	],
});
