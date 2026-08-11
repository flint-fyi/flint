import rule from "./invalidCodeLines.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule, {
    valid: ['a', 'a'],
    invalid: [
      {
        code: "",
        snapshot: \`
~
Rule report message.
\`,
      }
    ],
});
`,
			output: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule, {
    valid: ['a', 'a'],
    invalid: [
      {
        code: \`

\`,
        snapshot: \`
~
Rule report message.
\`,
      }
    ],
});
`,
			snapshot: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule, {
    valid: ['a', 'a'],
    invalid: [
      {
        code: "",
              ~~
              This code block should be formatted across multiple lines for more readable reports.
        snapshot: \`
~
Rule report message.
\`,
      }
    ],
});
`,
		},
		{
			code: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule, {
    valid: ['a', 'a'],
    invalid: [
      {
        code: \`console.log(
);\`,
        snapshot: \`console.log(
);
~
Rule report message.
\`,
      }
    ],
});
`,
			output: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule, {
    valid: ['a', 'a'],
    invalid: [
      {
        code: \`
console.log(
);
\`,
        snapshot: \`
console.log(
);
~
Rule report message.
\`,
      }
    ],
});
`,
			snapshot: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule, {
    valid: ['a', 'a'],
    invalid: [
      {
        code: \`console.log(
              ~~~~~~~~~~~~~
              This code block should be formatted across multiple lines for more readable reports.
);\`,
~~~
        snapshot: \`console.log(
);
~
Rule report message.
\`,
      }
    ],
});
`,
		},

		{
			code: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule, {
    valid: ['a', 'a'],
    invalid: [
      {
        code: \`
console.log();\`,
        snapshot: \`
console.log();
~
Rule report message.\`,
      }
    ],
});
`,
			output: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule, {
    valid: ['a', 'a'],
    invalid: [
      {
        code: \`
console.log();
\`,
        snapshot: \`
console.log();
~
Rule report message.
\`,
      }
    ],
});
`,
			snapshot: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule, {
    valid: ['a', 'a'],
    invalid: [
      {
        code: \`
              ~
              This code block should be formatted across multiple lines for more readable reports.
console.log();\`,
~~~~~~~~~~~~~~~
        snapshot: \`
console.log();
~
Rule report message.\`,
      }
    ],
});
`,
		},

		{
			code: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule, {
    valid: ['a', 'a'],
    invalid: [
      {
        code: \`console.log();\`,
        snapshot: \`console.log();
~~~~~~~~~~~~~
Rule report message.
\`,
      }
    ],
});
`,
			output: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule, {
    valid: ['a', 'a'],
    invalid: [
      {
        code: \`
console.log();
\`,
        snapshot: \`
console.log();
~~~~~~~~~~~~~
Rule report message.
\`,
      }
    ],
});
`,
			snapshot: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule, {
    valid: ['a', 'a'],
    invalid: [
      {
        code: \`console.log();\`,
              ~~~~~~~~~~~~~~~~
              This code block should be formatted across multiple lines for more readable reports.
        snapshot: \`console.log();
~~~~~~~~~~~~~
Rule report message.
\`,
      }
    ],
});
`,
		},
	],
	valid: [
		`
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule, {
    valid: [],
    invalid: []
});
`,
		`
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule, {
    valid: [],
    invalid: [
        {
            code: \`
\`,
            snapshot: \`
~
\`,
        }
    ],
});
`,
		`
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule, {
    valid: [],
    invalid: [
        {
            code: \`
console.log();
\`,
            snapshot: \`
console.log();
~~~~~~~~~~~~~
Rule report message.
\`,
        }
    ],
});
`,
	],
});
