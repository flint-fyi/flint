import { ruleTester } from "../ruleTester.ts";
import rule from "./dependencyUniqueness.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
{
  "dependencies": {
    "alpha": "1.0.0",
    "alpha": "2.0.0"
  }
}
`,
			snapshot: `
{
  "dependencies": {
    "alpha": "1.0.0",
    ~~~~~~~
    This dependency is overridden by a duplicate entry later in the same dependency collection.
    "alpha": "2.0.0"
  }
}
`,
			suggestions: [
				{
					id: "removeDependency",
					updated: `
{
  "dependencies": {
    "alpha": "2.0.0"
  }
}
`,
				},
			],
		},
		{
			code: `
{
  "bundleDependencies": ["alpha", "beta", "alpha"]
}
`,
			snapshot: `
{
  "bundleDependencies": ["alpha", "beta", "alpha"]
                         ~~~~~~~
                         This dependency is overridden by a duplicate entry later in the same dependency collection.
}
`,
			suggestions: [
				{
					id: "removeDependency",
					updated: `
{
  "bundleDependencies": ["beta", "alpha"]
}
`,
				},
			],
		},
		{
			code: `
{
  "bundleDependencies": ["alpha", "beta", "gamma", "beta"]
}
`,
			snapshot: `
{
  "bundleDependencies": ["alpha", "beta", "gamma", "beta"]
                                  ~~~~~~
                                  This dependency is overridden by a duplicate entry later in the same dependency collection.
}
`,
			suggestions: [
				{
					id: "removeDependency",
					updated: `
{
  "bundleDependencies": ["alpha", "gamma", "beta"]
}
`,
				},
			],
		},
		{
			code: `
{
  "bundledDependencies": ["alpha", "beta", "alpha"]
}
`,
			snapshot: `
{
  "bundledDependencies": ["alpha", "beta", "alpha"]
                          ~~~~~~~
                          This dependency is overridden by a duplicate entry later in the same dependency collection.
}
`,
			suggestions: [
				{
					id: "removeDependency",
					updated: `
{
  "bundledDependencies": ["beta", "alpha"]
}
`,
				},
			],
		},
		{
			code: `
{
  "overrides": {
    "alpha": "1.0.0",
    "alpha": "2.0.0"
  }
}
`,
			snapshot: `
{
  "overrides": {
    "alpha": "1.0.0",
    ~~~~~~~
    This dependency is overridden by a duplicate entry later in the same dependency collection.
    "alpha": "2.0.0"
  }
}
`,
			suggestions: [
				{
					id: "removeDependency",
					updated: `
{
  "overrides": {
    "alpha": "2.0.0"
  }
}
`,
				},
			],
		},
		{
			code: `
{
  "dependencies": {
    "alpha": "1.0.0"
  },
  "devDependencies": {
    "alpha": "1.0.0"
  }
}
`,
			snapshot: `
{
  "dependencies": {
    "alpha": "1.0.0"
  },
  "devDependencies": {
    "alpha": "1.0.0"
    ~~~~~~~
    This dependency is also declared in dependencies, which this rule treats as redundant here.
  }
}
`,
			suggestions: [
				{
					id: "removeDependency",
					updated: `
{
  "dependencies": {
    "alpha": "1.0.0"
  },
  "devDependencies": {}
}
`,
				},
			],
		},
		{
			code: `
{
  "dependencies": {
    "alpha": "1.0.0"
  },
  "peerDependencies": {
    "alpha": "^1.0.0"
  }
}
`,
			snapshot: `
{
  "dependencies": {
    "alpha": "1.0.0"
  },
  "peerDependencies": {
    "alpha": "^1.0.0"
    ~~~~~~~
    This dependency is also declared in dependencies, which this rule treats as redundant here.
  }
}
`,
			suggestions: [
				{
					id: "removeDependency",
					updated: `
{
  "dependencies": {
    "alpha": "1.0.0"
  },
  "peerDependencies": {}
}
`,
				},
			],
		},
	],
	valid: [
		`{}`,
		`
{
  "dependencies": {
    "alpha": "1.0.0"
  },
  "devDependencies": {
    "beta": "1.0.0"
  },
  "peerDependencies": {
    "gamma": "^1.0.0"
  }
}
`,
		`
{
  "optionalDependencies": {
    "alpha": "1.0.0"
  },
  "dependencies": {
    "alpha": "1.0.0"
  }
}
`,
		`
{
  "overrides": {
    "alpha": "1.0.0",
    "beta": "2.0.0"
  }
}
`,
	],
});
