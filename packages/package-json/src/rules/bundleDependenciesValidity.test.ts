import { directPropertyValidityRules } from "./directPropertyValidityRules.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.bundleDependenciesValidity, {
	invalid: [
		{
			code: `{
  "bundleDependencies": null
}`,
			snapshot: `{
  "bundleDependencies": null
                        ~~~~
                        Invalid bundleDependencies: the value is \`null\`, but should be an \`Array\` or a \`boolean\`.
}`,
		},
		{
			code: `{
  "bundleDependencies": 123
}`,
			snapshot: `{
  "bundleDependencies": 123
                        ~~~
                        Invalid bundleDependencies: the type should be \`Array\` or \`boolean\`, not \`number\`.
}`,
		},
		{
			code: `{
  "bundleDependencies": {}
}`,
			snapshot: `{
  "bundleDependencies": {}
                        ~~
                        Invalid bundleDependencies: the type should be \`Array\` or \`boolean\`, not \`object\`.
}`,
		},
	],
	valid: [
		{
			code: `{}`,
		},
		{
			code: `{
  "bundleDependencies": []
}`,
		},
		{
			code: `{
  "bundleDependencies": ["pkg-a", "pkg-b"]
}`,
		},
		{
			code: `{
  "bundleDependencies": true
}`,
		},
		{
			code: `{
  "bundleDependencies": false
}`,
		},
	],
});
