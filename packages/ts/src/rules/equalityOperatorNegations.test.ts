import rule from "./equalityOperatorNegations.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
!value === true
`,
			snapshot: `
!value === true
~
Negating the left operand of '===' is likely a mistake.
`,
		},
		{
			code: `
!value !== true
`,
			snapshot: `
!value !== true
~
Negating the left operand of '!==' is likely a mistake.
`,
		},
		{
			code: `
!value == true
`,
			snapshot: `
!value == true
~
Negating the left operand of '==' is likely a mistake.
`,
		},
		{
			code: `
!value != true
`,
			snapshot: `
!value != true
~
Negating the left operand of '!=' is likely a mistake.
`,
		},
		{
			code: `
!a === b
`,
			snapshot: `
!a === b
~
Negating the left operand of '===' is likely a mistake.
`,
		},
		{
			code: `
if (!count === 0) {}
`,
			snapshot: `
if (!count === 0) {}
    ~
    Negating the left operand of '===' is likely a mistake.
`,
		},
		{
			code: `
const result = !status === expected;
`,
			snapshot: `
const result = !status === expected;
               ~
               Negating the left operand of '===' is likely a mistake.
`,
		},
		{
			code: `
(!value) === other
`,
			snapshot: `
(!value) === other
 ~
 Negating the left operand of '===' is likely a mistake.
`,
		},
		{
			code: `
!getValue() === expected
`,
			snapshot: `
!getValue() === expected
~
Negating the left operand of '===' is likely a mistake.
`,
		},
	],
	valid: [
		`value === true`,
		`value !== false`,
		`a == b`,
		`a != b`,
		`!(value === true)`,
		`!(a !== b)`,
		`!!value === true`,
		`!!a === !!b`,
		`!value`,
		`value === !other`,
		`a !== !b`,
	],
});
