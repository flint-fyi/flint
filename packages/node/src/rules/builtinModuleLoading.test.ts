import rule from "./builtinModuleLoading.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `const fileSystem = await import("node:fs");
            fileSystem.readFileSync("example.txt", "utf8");`,
			snapshot: `const fileSystem = await import("node:fs");
                         ~~~~~~~~~~~~~~~~~
                         Prefer \`process.getBuiltinModule()\` over loading Node.js built-in modules.
            fileSystem.readFileSync("example.txt", "utf8");`,
		},
	],
	valid: [
		`const fileSystem = process.getBuiltinModule("node:fs");`,
		`const fileSystem = import("node:fs");`,
		`const data = await import("typescript");`,
		`const fileSystem = require("node:fs");`,
	],
});
