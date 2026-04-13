import { directPropertyValidityRules } from "./directPropertyValidityRules.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.cpuValidity, {
	invalid: [
		{
			code: `{
  "cpu": null
}`,
			snapshot: `{
  "cpu": null
         ~~~~
         Invalid cpu: the value is \`null\`, but should be an \`Array\` of strings.
}`,
		},
		{
			code: `{
  "cpu": 123
}`,
			snapshot: `{
  "cpu": 123
         ~~~
         Invalid cpu: the type should be \`Array\`, not \`number\`.
}`,
		},
		{
			code: `{
  "cpu": {}
}`,
			snapshot: `{
  "cpu": {}
         ~~
         Invalid cpu: the type should be \`Array\`, not \`object\`.
}`,
		},
	],
	valid: [
		{
			code: `{}`,
		},
		{
			code: `{
  "cpu": []
}`,
		},
		{
			code: `{
  "cpu": ["arm", "x64"]
}`,
		},
	],
});
