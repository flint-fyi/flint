import { ruleTester } from "../ruleTester.ts";
import peerDependenciesMetaRelationship from "./peerDependenciesMetaRelationship.ts";

ruleTester.describe(peerDependenciesMetaRelationship, {
	invalid: [
		{
			code: `
{
  "peerDependencies": {},
  "peerDependenciesMeta": {
		"some-dependency": {
			"optional": true
		}
	}
}
`,
			snapshot: `
{
  "peerDependencies": {},
  "peerDependenciesMeta": {
		"some-dependency": {
		~~~~~~~~~~~~~~~~~
		Dependency 'some-dependency' is declared in \`peerDependenciesMeta\` but not in \`peerDependencies\`.
			"optional": true
		}
	}
}
`,
			suggestions: [
				{
					id: "removeUnnecessaryPeerDependencyMeta",
					updated: `
{
  "peerDependencies": {},
  "peerDependenciesMeta": {}
}
`,
				},
			],
		},
		{
			code: `
{
  "peerDependenciesMeta": {
		"some-dependency": {
			"optional": true
		}
	}
}
`,
			snapshot: `
{
  "peerDependenciesMeta": {
		"some-dependency": {
		~~~~~~~~~~~~~~~~~
		Dependency 'some-dependency' is declared in \`peerDependenciesMeta\` but not in \`peerDependencies\`.
			"optional": true
		}
	}
}
`,
			suggestions: [
				{
					id: "removeUnnecessaryPeerDependencyMeta",
					updated: `
{
  "peerDependenciesMeta": {}
}
`,
				},
			],
		},
		{
			code: `
{
  "peerDependencies": {
		"one-dependency": "^1.0.0"
	},
  "peerDependenciesMeta": {
		"one-dependency": {
			"optional": true
		},
		"some-other-dependency": {
			"optional": true
		}
	}
}
`,
			snapshot: `
{
  "peerDependencies": {
		"one-dependency": "^1.0.0"
	},
  "peerDependenciesMeta": {
		"one-dependency": {
			"optional": true
		},
		"some-other-dependency": {
		~~~~~~~~~~~~~~~~~~~~~~~
		Dependency 'some-other-dependency' is declared in \`peerDependenciesMeta\` but not in \`peerDependencies\`.
			"optional": true
		}
	}
}
`,
			suggestions: [
				{
					id: "removeUnnecessaryPeerDependencyMeta",
					updated: `
{
  "peerDependencies": {
		"one-dependency": "^1.0.0"
	},
  "peerDependenciesMeta": {
		"one-dependency": {
			"optional": true
		}
	}
}
`,
				},
			],
		},
	],
	valid: [
		"{}",
		`{
  "peerDependencies": {}
}`,
		`{
  "peerDependenciesMeta": {}
}`,
		`{
  "peerDependencies": {},
  "peerDependenciesMeta": {}
}`,
		`{
  "peerDependencies": {
		"one-dependency": "^1.0.0"
	},
  "peerDependenciesMeta": {
		"one-dependency": {
			"optional": true
		}
	}
}`,
	],
});
