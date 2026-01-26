import rule from "./typeImports.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `import { User } from "./types";
type Admin = User & { isAdmin: boolean };`,
			snapshot: `import { User } from "./types";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Use 'import type' for type-only imports.
type Admin = User & { isAdmin: boolean };`,
		},
		{
			code: `import { Props } from "./types";
interface Component {
    props: Props;
}`,
			snapshot: `import { Props } from "./types";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Use 'import type' for type-only imports.
interface Component {
    props: Props;
}`,
		},
		{
			code: `import { Config } from "./config";
function setup(config: Config): void {}`,
			snapshot: `import { Config } from "./config";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Use 'import type' for type-only imports.
function setup(config: Config): void {}`,
		},
	],
	valid: [
		`import type { User } from "./types";
type Admin = User & { isAdmin: boolean };`,
		`import { createUser } from "./users";
const user = createUser();`,
		`import { User } from "./types";
const user = new User();`,
		`import { format } from "./utils";
console.log(format("hello"));`,
		`import { Component } from "./component";
export class MyComponent extends Component {}`,
	],
});
