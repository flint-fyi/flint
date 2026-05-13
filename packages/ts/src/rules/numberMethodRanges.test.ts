import rule from "./numberMethodRanges.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
value.toString(1);
`,
			snapshot: `
value.toString(1);
               ~
               The argument \`1\` is out of range for \`toString\`. Use a value between 2 and 36.
`,
		},
		{
			code: `
value.toString(37);
`,
			snapshot: `
value.toString(37);
               ~~
               The argument \`37\` is out of range for \`toString\`. Use a value between 2 and 36.
`,
		},
		{
			code: `
value.toString(0);
`,
			snapshot: `
value.toString(0);
               ~
               The argument \`0\` is out of range for \`toString\`. Use a value between 2 and 36.
`,
		},
		{
			code: `
value.toString(-1);
`,
			snapshot: `
value.toString(-1);
               ~~
               The argument \`-1\` is out of range for \`toString\`. Use a value between 2 and 36.
`,
		},
		{
			code: `
value.toString(2.5);
`,
			snapshot: `
value.toString(2.5);
               ~~~
               The argument \`2.5\` is out of range for \`toString\`. Use a value between 2 and 36.
`,
		},
		{
			code: `
value['toString'](1);
`,
			snapshot: `
value['toString'](1);
                  ~
                  The argument \`1\` is out of range for \`toString\`. Use a value between 2 and 36.
`,
		},
		{
			code: `
value.toFixed(-1);
`,
			snapshot: `
value.toFixed(-1);
              ~~
              The argument \`-1\` is out of range for \`toFixed\`. Use a value between 0 and 100.
`,
		},
		{
			code: `
value.toFixed(101);
`,
			snapshot: `
value.toFixed(101);
              ~~~
              The argument \`101\` is out of range for \`toFixed\`. Use a value between 0 and 100.
`,
		},
		{
			code: `
value.toFixed(1.5);
`,
			snapshot: `
value.toFixed(1.5);
              ~~~
              The argument \`1.5\` is out of range for \`toFixed\`. Use a value between 0 and 100.
`,
		},
		{
			code: `
value.toExponential(-1);
`,
			snapshot: `
value.toExponential(-1);
                    ~~
                    The argument \`-1\` is out of range for \`toExponential\`. Use a value between 0 and 100.
`,
		},
		{
			code: `
value.toExponential(101);
`,
			snapshot: `
value.toExponential(101);
                    ~~~
                    The argument \`101\` is out of range for \`toExponential\`. Use a value between 0 and 100.
`,
		},
		{
			code: `
value.toPrecision(0);
`,
			snapshot: `
value.toPrecision(0);
                  ~
                  The argument \`0\` is out of range for \`toPrecision\`. Use a value between 1 and 100.
`,
		},
		{
			code: `
value.toPrecision(101);
`,
			snapshot: `
value.toPrecision(101);
                  ~~~
                  The argument \`101\` is out of range for \`toPrecision\`. Use a value between 1 and 100.
`,
		},
		{
			code: `
value.toPrecision(-1);
`,
			snapshot: `
value.toPrecision(-1);
                  ~~
                  The argument \`-1\` is out of range for \`toPrecision\`. Use a value between 1 and 100.
`,
		},
		{
			code: `
value['toFixed'](101);
`,
			snapshot: `
value['toFixed'](101);
                 ~~~
                 The argument \`101\` is out of range for \`toFixed\`. Use a value between 0 and 100.
`,
		},
	],
	valid: [
		`value.toString();`,
		`value.toString(2);`,
		`value.toString(10);`,
		`value.toString(16);`,
		`value.toString(36);`,
		`value.toFixed();`,
		`value.toFixed(0);`,
		`value.toFixed(2);`,
		`value.toFixed(100);`,
		`value.toExponential();`,
		`value.toExponential(0);`,
		`value.toExponential(5);`,
		`value.toExponential(100);`,
		`value.toPrecision();`,
		`value.toPrecision(1);`,
		`value.toPrecision(10);`,
		`value.toPrecision(100);`,
		`value['toString'](10);`,
		`value['toFixed'](2);`,
		`value.toString(radix);`,
		`value.toFixed(digits);`,
		`someOtherMethod(1);`,
		`obj.someMethod(1);`,
	],
});
