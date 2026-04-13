import { directPropertyValidityRules } from "./directPropertyValidityRules.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.devDependenciesValidity, {
	invalid: [
		{
			code: `{
  "devDependencies": null
}`,
			snapshot: `{
  "devDependencies": null
                     ~~~~
                     Invalid devDependencies: the value is \`null\`, but should be a record of dependencies.
}`,
		},
		{
			code: `{
  "devDependencies": 123
}`,
			snapshot: `{
  "devDependencies": 123
                     ~~~
                     Invalid devDependencies: the type should be \`object\`, not \`number\`.
}`,
		},
		{
			code: `{
  "devDependencies": []
}`,
			snapshot: `{
  "devDependencies": []
                     ~~
                     Invalid devDependencies: the type should be \`object\`, not \`array\`.
}`,
		},
	],
	valid: [
		{
			code: `{}`,
		},
		{
			code: `{
  "devDependencies": {}
}`,
		},
		{
			code: `{
  "devDependencies": { "vitest": "^1.0.0" }
}`,
		},
	],
});
