import { directPropertyValidityRules } from "./directPropertyValidityRules.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.optionalDependenciesValidity, {
	invalid: [
		{
			code: `{
  "optionalDependencies": null
}`,
			snapshot: `{
  "optionalDependencies": null
                          ~~~~
                          Invalid optionalDependencies: the value is \`null\`, but should be a record of dependencies.
}`,
		},
		{
			code: `{
  "optionalDependencies": 123
}`,
			snapshot: `{
  "optionalDependencies": 123
                          ~~~
                          Invalid optionalDependencies: the type should be \`object\`, not \`number\`.
}`,
		},
		{
			code: `{
  "optionalDependencies": []
}`,
			snapshot: `{
  "optionalDependencies": []
                          ~~
                          Invalid optionalDependencies: the type should be \`object\`, not \`array\`.
}`,
		},
	],
	valid: [
		{
			code: `{}`,
		},
		{
			code: `{
  "optionalDependencies": {}
}`,
		},
		{
			code: `{
  "optionalDependencies": { "fsevents": "^2.0.0" }
}`,
		},
	],
});
