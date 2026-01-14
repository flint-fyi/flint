import { ruleTester } from "./ruleTester.ts";
import rule from "./unsafeNegations.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
!key in object;
`,
			snapshot: `
!key in object;
~
This negation applies before the \`in\` operator.
`,
		},
		{
			code: `
!object instanceof Constructor;
`,
			snapshot: `
!object instanceof Constructor;
~
This negation applies before the \`instanceof\` operator.
`,
		},
		{
			code: `
(!key) in object;
`,
			snapshot: `
(!key) in object;
 ~
 This negation applies before the \`in\` operator.
`,
		},
		{
			code: `
(!object) instanceof Constructor;
`,
			snapshot: `
(!object) instanceof Constructor;
 ~
 This negation applies before the \`instanceof\` operator.
`,
		},
		{
			code: `
const exists = !key in object;
`,
			snapshot: `
const exists = !key in object;
               ~
               This negation applies before the \`in\` operator.
`,
		},
	],
	valid: [
		`!(key in object);`,
		`!(object instanceof Constructor);`,
		`key in object;`,
		`object instanceof Constructor;`,
		`!flag && key in object;`,
	],
});
