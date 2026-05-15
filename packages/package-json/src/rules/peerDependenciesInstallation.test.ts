import { ruleTester } from "../ruleTester.ts";
import rule from "./peerDependenciesInstallation.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
{
    "peerDependencies": {
        "typescript": "^5.9.0"
    }
}
`,
			snapshot: `
{
    "peerDependencies": {
        "typescript": "^5.9.0"
        ~~~~~~~~~~~~
        Peer dependency \`typescript\` should also be declared in devDependencies.
    }
}
`,
		},
		{
			code: `
{
    "devDependencies": {
        "vitest": "^4.0.0"
    },
    "peerDependencies": {
        "typescript": "^5.9.0",
        "vitest": "^4.0.0"
    }
}
`,
			snapshot: `
{
    "devDependencies": {
        "vitest": "^4.0.0"
    },
    "peerDependencies": {
        "typescript": "^5.9.0",
        ~~~~~~~~~~~~
        Peer dependency \`typescript\` should also be declared in devDependencies.
        "vitest": "^4.0.0"
    }
}
`,
		},
	],
	valid: [
		`{}`,
		`{ "peerDependencies": null }`,
		`{ "peerDependencies": {} }`,
		`
{
    "devDependencies": {
        "typescript": "^5.9.0"
    },
    "peerDependencies": {
        "typescript": "^5.0.0 || ^6.0.0"
    }
}
`,
	],
});
