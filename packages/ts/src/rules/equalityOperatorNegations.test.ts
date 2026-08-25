import rule from "./equalityOperatorNegations.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const value: unknown;
!value === true
`,
			snapshot: `
declare const value: unknown;
!value === true
~
Negating the left operand of '===' is likely a mistake.
`,
		},
		{
			code: `
declare const value: unknown;
!value !== true
`,
			snapshot: `
declare const value: unknown;
!value !== true
~
Negating the left operand of '!==' is likely a mistake.
`,
		},
		{
			code: `
declare const value: unknown;
!value == true
`,
			snapshot: `
declare const value: unknown;
!value == true
~
Negating the left operand of '==' is likely a mistake.
`,
		},
		{
			code: `
declare const value: unknown;
!value != true
`,
			snapshot: `
declare const value: unknown;
!value != true
~
Negating the left operand of '!=' is likely a mistake.
`,
		},
		{
			code: `
declare const a: unknown;
declare const b: boolean;
!a === b
`,
			snapshot: `
declare const a: unknown;
declare const b: boolean;
!a === b
~
Negating the left operand of '===' is likely a mistake.
`,
		},
		{
			code: `
declare const count: number;
if (!count === false) {}
`,
			snapshot: `
declare const count: number;
if (!count === false) {}
    ~
    Negating the left operand of '===' is likely a mistake.
`,
		},
		{
			code: `
declare const status: unknown;
declare const expected: boolean;
const result = !status === expected;
`,
			snapshot: `
declare const status: unknown;
declare const expected: boolean;
const result = !status === expected;
               ~
               Negating the left operand of '===' is likely a mistake.
`,
		},
		{
			code: `
declare const value: unknown;
declare const other: boolean;
(!value) === other
`,
			snapshot: `
declare const value: unknown;
declare const other: boolean;
(!value) === other
 ~
 Negating the left operand of '===' is likely a mistake.
`,
		},
		{
			code: `
declare function getValue(): unknown;
declare const expected: boolean;
!getValue() === expected
`,
			snapshot: `
declare function getValue(): unknown;
declare const expected: boolean;
!getValue() === expected
~
Negating the left operand of '===' is likely a mistake.
`,
		},
	],
	valid: [
		`
declare const value: unknown;
value === true
`,
		`
declare const value: unknown;
value !== false
`,
		`
declare const a: unknown;
declare const b: unknown;
a == b
`,
		`
declare const a: unknown;
declare const b: unknown;
a != b
`,
		`
declare const value: unknown;
!(value === true)
`,
		`
declare const a: unknown;
declare const b: unknown;
!(a !== b)
`,
		`
declare const value: unknown;
!!value === true
`,
		`
declare const a: unknown;
declare const b: unknown;
!!a === !!b
`,
		`
declare const value: unknown;
!value
`,
		`
declare const value: boolean;
declare const other: unknown;
value === !other
`,
		`
declare const a: boolean;
declare const b: unknown;
a !== !b
`,
	],
});
