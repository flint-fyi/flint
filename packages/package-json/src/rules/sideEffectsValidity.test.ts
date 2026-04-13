import { directPropertyValidityRules } from "./directPropertyValidityRules.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.sideEffectsValidity, {
	invalid: [
		{
			code: `{
  "sideEffects": null
}`,
			snapshot: `{
  "sideEffects": null
                 ~~~~
                 Invalid sideEffects: the value is \`null\`, but should be a \`boolean\` or an \`Array\`.
}`,
		},
		{
			code: `{
  "sideEffects": 123
}`,
			snapshot: `{
  "sideEffects": 123
                 ~~~
                 Invalid sideEffects: the type should be \`boolean\` or \`Array\`, not \`number\`.
}`,
		},
		{
			code: `{
  "sideEffects": {}
}`,
			snapshot: `{
  "sideEffects": {}
                 ~~
                 Invalid sideEffects: the type should be \`boolean\` or \`Array\`, not \`object\`.
}`,
		},
	],
	valid: [
		{
			code: `{}`,
		},
		{
			code: `{
  "sideEffects": true
}`,
		},
		{
			code: `{
  "sideEffects": false
}`,
		},
		{
			code: `{
  "sideEffects": []
}`,
		},
		{
			code: `{
  "sideEffects": ["./dist/polyfill.js"]
}`,
		},
	],
});
