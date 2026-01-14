import rule from "./invalidCodeLines.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
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
ruleTester.describe(rule, {
    valid: ['a', 'a'],
    invalid: [
      {
        code: \`console.log();\`,
        snapshot: \`console.log();
~~~~~~~~~~~~
Rule report message.
\`,
      }
    ],
});
`,
			output: `
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
ruleTester.describe(rule, {
    valid: ['a', 'a'],
    invalid: [
      {
        code: \`console.log();\`,
              ~~~~~~~~~~~~~~~~
              This code block should be formatted across multiple lines for more readable reports.
        snapshot: \`console.log();
~~~~~~~~~~~~
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
            ruleTester.describe(rule, {
                valid: [],
                invalid: []
            });
    `,
		`
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
            ruleTester.describe(rule, {
                valid: [],
                invalid: [
                {
                    code: \`
console.log();
\`,
                    snapshot: \`
~~~~~~~~~~~~
Rule report message.
\`,
    }
                ],
            });
    `,
	],
});
