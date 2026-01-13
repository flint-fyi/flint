import rule from "./importAssignments.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import mod from "mod";
mod = 1;
`,
			snapshot: `
import mod from "mod";
mod = 1;
~~~
'mod' is an imported binding and cannot be reassigned.
`,
		},
		{
			code: `
import mod from "mod";
mod += 1;
`,
			snapshot: `
import mod from "mod";
mod += 1;
~~~
'mod' is an imported binding and cannot be reassigned.
`,
		},
		{
			code: `
import mod from "mod";
mod++;
`,
			snapshot: `
import mod from "mod";
mod++;
~~~
'mod' is an imported binding and cannot be reassigned.
`,
		},
		{
			code: `
import mod from "mod";
++mod;
`,
			snapshot: `
import mod from "mod";
++mod;
  ~~~
  'mod' is an imported binding and cannot be reassigned.
`,
		},
		{
			code: `
import { named } from "mod";
named = 1;
`,
			snapshot: `
import { named } from "mod";
named = 1;
~~~~~
'named' is an imported binding and cannot be reassigned.
`,
		},
		{
			code: `
import { named } from "mod";
named++;
`,
			snapshot: `
import { named } from "mod";
named++;
~~~~~
'named' is an imported binding and cannot be reassigned.
`,
		},
		{
			code: `
import * as mod from "mod";
mod = 1;
`,
			snapshot: `
import * as mod from "mod";
mod = 1;
~~~
'mod' is an imported binding and cannot be reassigned.
`,
		},
		{
			code: `
import * as mod from "mod";
mod.prop = 1;
`,
			snapshot: `
import * as mod from "mod";
mod.prop = 1;
~~~
The members of 'mod' are read-only and cannot be modified.
`,
		},
		{
			code: `
import * as mod from "mod";
mod["prop"] = 1;
`,
			snapshot: `
import * as mod from "mod";
mod["prop"] = 1;
~~~
The members of 'mod' are read-only and cannot be modified.
`,
		},
		{
			code: `
import * as mod from "mod";
mod.prop++;
`,
			snapshot: `
import * as mod from "mod";
mod.prop++;
~~~
The members of 'mod' are read-only and cannot be modified.
`,
		},
		{
			code: `
import * as mod from "mod";
++mod.prop;
`,
			snapshot: `
import * as mod from "mod";
++mod.prop;
  ~~~
  The members of 'mod' are read-only and cannot be modified.
`,
		},
		{
			code: `
import * as mod from "mod";
delete mod.prop;
`,
			snapshot: `
import * as mod from "mod";
delete mod.prop;
       ~~~
       The members of 'mod' are read-only and cannot be modified.
`,
		},
		{
			code: `
import * as mod from "mod";
for (mod.prop in items) {}
`,
			snapshot: `
import * as mod from "mod";
for (mod.prop in items) {}
     ~~~
     The members of 'mod' are read-only and cannot be modified.
`,
		},
		{
			code: `
import * as mod from "mod";
for (mod.prop of items) {}
`,
			snapshot: `
import * as mod from "mod";
for (mod.prop of items) {}
     ~~~
     The members of 'mod' are read-only and cannot be modified.
`,
		},
		{
			code: `
import * as mod from "mod";
Object.assign(mod, { a: 1 });
`,
			snapshot: `
import * as mod from "mod";
Object.assign(mod, { a: 1 });
              ~~~
              The members of 'mod' are read-only and cannot be modified.
`,
		},
		{
			code: `
import * as mod from "mod";
Object.defineProperty(mod, "key", { value: 1 });
`,
			snapshot: `
import * as mod from "mod";
Object.defineProperty(mod, "key", { value: 1 });
                      ~~~
                      The members of 'mod' are read-only and cannot be modified.
`,
		},

		{
			code: `
import { a, b } from "mod";
a = 1;
b = 2;
`,
			snapshot: `
import { a, b } from "mod";
a = 1;
~
'a' is an imported binding and cannot be reassigned.
b = 2;
~
'b' is an imported binding and cannot be reassigned.
`,
		},
	],
	valid: [
		`import mod from "mod"; console.log(mod);`,
		`import { named } from "mod"; console.log(named);`,
		`import * as mod from "mod"; console.log(mod);`,
		`import * as mod from "mod"; console.log(mod.prop);`,
		// Regular imports can have their members modified
		`import mod from "mod"; mod.prop = 1;`,
		`import { named } from "mod"; named.prop = 1;`,
		// Local variables can shadow imports
		`import mod from "mod"; { let mod; mod = 1; }`,
		// Not an import - regular variable
		`let mod; mod = 1; export {};`,
		// Dynamic imports are not affected
		`const mod = await import("mod"); mod.foo = 1; export {};`,
	],
});
