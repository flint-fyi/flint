import rule from "./numberMethodRanges.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const value: number;
value.toString(1);
`,
			snapshot: `
declare const value: number;
value.toString(1);
               ~
               The argument \`1\` is out of range for \`toString\`. Use a value between 2 and 36.
`,
		},
		{
			code: `
declare const value: number;
value.toString(37);
`,
			snapshot: `
declare const value: number;
value.toString(37);
               ~~
               The argument \`37\` is out of range for \`toString\`. Use a value between 2 and 36.
`,
		},
		{
			code: `
declare const value: number;
value.toString(0);
`,
			snapshot: `
declare const value: number;
value.toString(0);
               ~
               The argument \`0\` is out of range for \`toString\`. Use a value between 2 and 36.
`,
		},
		{
			code: `
declare const value: number;
value.toString(-1);
`,
			snapshot: `
declare const value: number;
value.toString(-1);
               ~~
               The argument \`-1\` is out of range for \`toString\`. Use a value between 2 and 36.
`,
		},
		{
			code: `
declare const value: number;
value.toString(2.5);
`,
			snapshot: `
declare const value: number;
value.toString(2.5);
               ~~~
               The argument \`2.5\` is out of range for \`toString\`. Use a value between 2 and 36.
`,
		},
		{
			code: `
declare const value: number;
value['toString'](1);
`,
			snapshot: `
declare const value: number;
value['toString'](1);
                  ~
                  The argument \`1\` is out of range for \`toString\`. Use a value between 2 and 36.
`,
		},
		{
			code: `
declare const value: number;
value.toFixed(-1);
`,
			snapshot: `
declare const value: number;
value.toFixed(-1);
              ~~
              The argument \`-1\` is out of range for \`toFixed\`. Use a value between 0 and 100.
`,
		},
		{
			code: `
declare const value: number;
value.toFixed(101);
`,
			snapshot: `
declare const value: number;
value.toFixed(101);
              ~~~
              The argument \`101\` is out of range for \`toFixed\`. Use a value between 0 and 100.
`,
		},
		{
			code: `
declare const value: number;
value.toFixed(1.5);
`,
			snapshot: `
declare const value: number;
value.toFixed(1.5);
              ~~~
              The argument \`1.5\` is out of range for \`toFixed\`. Use a value between 0 and 100.
`,
		},
		{
			code: `
declare const value: number;
value.toExponential(-1);
`,
			snapshot: `
declare const value: number;
value.toExponential(-1);
                    ~~
                    The argument \`-1\` is out of range for \`toExponential\`. Use a value between 0 and 100.
`,
		},
		{
			code: `
declare const value: number;
value.toExponential(101);
`,
			snapshot: `
declare const value: number;
value.toExponential(101);
                    ~~~
                    The argument \`101\` is out of range for \`toExponential\`. Use a value between 0 and 100.
`,
		},
		{
			code: `
declare const value: number;
value.toPrecision(0);
`,
			snapshot: `
declare const value: number;
value.toPrecision(0);
                  ~
                  The argument \`0\` is out of range for \`toPrecision\`. Use a value between 1 and 100.
`,
		},
		{
			code: `
declare const value: number;
value.toPrecision(101);
`,
			snapshot: `
declare const value: number;
value.toPrecision(101);
                  ~~~
                  The argument \`101\` is out of range for \`toPrecision\`. Use a value between 1 and 100.
`,
		},
		{
			code: `
declare const value: number;
value.toPrecision(-1);
`,
			snapshot: `
declare const value: number;
value.toPrecision(-1);
                  ~~
                  The argument \`-1\` is out of range for \`toPrecision\`. Use a value between 1 and 100.
`,
		},
		{
			code: `
declare const value: number;
value['toFixed'](101);
`,
			snapshot: `
declare const value: number;
value['toFixed'](101);
                 ~~~
                 The argument \`101\` is out of range for \`toFixed\`. Use a value between 0 and 100.
`,
		},
	],
	valid: [
		`
declare const value: number;
value.toString();
`,
		`
declare const value: number;
value.toString(2);
`,
		`
declare const value: number;
value.toString(10);
`,
		`
declare const value: number;
value.toString(16);
`,
		`
declare const value: number;
value.toString(36);
`,
		`
declare const value: number;
value.toFixed();
`,
		`
declare const value: number;
value.toFixed(0);
`,
		`
declare const value: number;
value.toFixed(2);
`,
		`
declare const value: number;
value.toFixed(100);
`,
		`
declare const value: number;
value.toExponential();
`,
		`
declare const value: number;
value.toExponential(0);
`,
		`
declare const value: number;
value.toExponential(5);
`,
		`
declare const value: number;
value.toExponential(100);
`,
		`
declare const value: number;
value.toPrecision();
`,
		`
declare const value: number;
value.toPrecision(1);
`,
		`
declare const value: number;
value.toPrecision(10);
`,
		`
declare const value: number;
value.toPrecision(100);
`,
		`
declare const value: number;
value['toString'](10);
`,
		`
declare const value: number;
value['toFixed'](2);
`,
		`
declare const value: number;
declare const radix: number;
value.toString(radix);
`,
		`
declare const value: number;
declare const digits: number;
value.toFixed(digits);
`,
		`
declare function someOtherMethod(value: number): void;
someOtherMethod(1);
`,
		`
declare const obj: { someMethod(value: number): void };
obj.someMethod(1);
`,
	],
});
