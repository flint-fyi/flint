import { ruleTester } from "./ruleTester.ts";
import rule from "./unnecessaryMathClamps.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const value = Math.min(5, 10);
`,
			snapshot: `
const value = Math.min(5, 10);
              ~~~~~~~~~~~~~~~
              This \`Math.min\` with all constant arguments will always return \`5\`.
`,
		},
		{
			code: `
const value = Math.max(3, 7);
`,
			snapshot: `
const value = Math.max(3, 7);
              ~~~~~~~~~~~~~~
              This \`Math.max\` with all constant arguments will always return \`7\`.
`,
		},
		{
			code: `
const value = Math.min(10, 5, 15);
`,
			snapshot: `
const value = Math.min(10, 5, 15);
              ~~~~~~~~~~~~~~~~~~~
              This \`Math.min\` with all constant arguments will always return \`5\`.
`,
		},
		{
			code: `
const value = Math.max(1, 2, 3, 4);
`,
			snapshot: `
const value = Math.max(1, 2, 3, 4);
              ~~~~~~~~~~~~~~~~~~~~
              This \`Math.max\` with all constant arguments will always return \`4\`.
`,
		},
		{
			code: `
const value = Math.min(100);
`,
			snapshot: `
const value = Math.min(100);
              ~~~~~~~~~~~~~
              This \`Math.min\` with all constant arguments will always return \`100\`.
`,
		},
		{
			code: `
const value = Math.max(-5, -10);
`,
			snapshot: `
const value = Math.max(-5, -10);
              ~~~~~~~~~~~~~~~~~
              This \`Math.max\` with all constant arguments will always return \`-5\`.
`,
		},
		{
			code: `
const value = Math.min(-5, 0, 5);
`,
			snapshot: `
const value = Math.min(-5, 0, 5);
              ~~~~~~~~~~~~~~~~~~
              This \`Math.min\` with all constant arguments will always return \`-5\`.
`,
		},
		{
			code: `
const value = Math.min((5), (10));
`,
			snapshot: `
const value = Math.min((5), (10));
              ~~~~~~~~~~~~~~~~~~~
              This \`Math.min\` with all constant arguments will always return \`5\`.
`,
		},
		{
			code: `
const value = Math.max(5, Math.min(10, x));
`,
			snapshot: `
const value = Math.max(5, Math.min(10, x));
              ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
              Incorrect clamping pattern: \`Math.max(5, Math.min(10, x))\` should be \`Math.min(10, Math.max(5, x))\`.
`,
		},
		{
			code: `
const value = Math.max(0, Math.min(100, value));
`,
			snapshot: `
const value = Math.max(0, Math.min(100, value));
              ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
              Incorrect clamping pattern: \`Math.max(0, Math.min(100, x))\` should be \`Math.min(100, Math.max(0, x))\`.
`,
		},
		{
			code: `
const value = Math.max(10, Math.min(20, input));
`,
			snapshot: `
const value = Math.max(10, Math.min(20, input));
              ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
              Incorrect clamping pattern: \`Math.max(10, Math.min(20, x))\` should be \`Math.min(20, Math.max(10, x))\`.
`,
		},
		{
			code: `
const value = Math.max(-10, Math.min(10, score));
`,
			snapshot: `
const value = Math.max(-10, Math.min(10, score));
              ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
              Incorrect clamping pattern: \`Math.max(-10, Math.min(10, x))\` should be \`Math.min(10, Math.max(-10, x))\`.
`,
		},
		{
			code: `
const result = Math.max(5, Math.min(x, 10));
`,
			snapshot: `
const result = Math.max(5, Math.min(x, 10));
               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
               Incorrect clamping pattern: \`Math.max(5, Math.min(10, x))\` should be \`Math.min(10, Math.max(5, x))\`.
`,
		},
	],
	valid: [
		`const value = Math.min(x, 10);`,
		`const value = Math.max(value, 5);`,
		`const value = Math.min(a, b);`,
		`const value = Math.max(x, y, z);`,
		`const value = Math.min(Math.max(x, 5), 10);`,
		`const value = Math.min(10, Math.max(5, x));`,
		`const value = Math.min(Math.max(min, value), max);`,
		`const value = Math.max(x, Math.max(y, z));`,
		`const value = Math.min(x, Math.min(y, z));`,
		`const value = Math.min(getMax(), value);`,
		`const value = Math?.min(5, 10);`,
		`const value = Math.min?.(5, 10);`,
		`const value = Math.min(...args);`,
		`const myMath = { min: (a, b) => a < b ? a : b }; const value = myMath.min(5, 10);`,
		`function test(Math: { min: (a: number, b: number) => number }) { return Math.min(5, 10); }`,
		`const value = Math.min(100, Math.max(50, x));`,
		`const value = Math.min(max, Math.max(min, value));`,
	],
});
