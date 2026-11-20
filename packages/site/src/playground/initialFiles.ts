import type { PlaygroundFile } from "./types.ts";

export const initialFiles: PlaygroundFile[] = [
	{
		code: `import { users } from "./users";

const firstAdmin = users.filter((user) => user.isAdmin)[0];

debugger;

export { firstAdmin };
`,
		name: "index.ts",
	},
	{
		code: `export interface User {
	isAdmin: boolean;
	name: string;
}

export const users: User[] = [
	{ isAdmin: false, name: "Ada" },
	{ isAdmin: "yes", name: "Grace" },
];
`,
		name: "users.ts",
	},
	{
		code: `{
	"name": "example",
	"retries": 3,
	"retries": 5,
	"timeout": 1e400
}
`,
		name: "config.json",
	},
];
