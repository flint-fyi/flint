import { ruleTester } from "./ruleTester.ts";
import rule from "./unnecessaryTernaries.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const result = condition ? true : false;
`,
			output: `
const result = condition;
`,
			snapshot: `
const result = condition ? true : false;
               ~~~~~~~~~~~~~~~~~~~~~~~~
               This ternary expression can be simplified to a boolean expression.
`,
		},
		{
			code: `
const result = isValid ? true : false;
`,
			output: `
const result = isValid;
`,
			snapshot: `
const result = isValid ? true : false;
               ~~~~~~~~~~~~~~~~~~~~~~
               This ternary expression can be simplified to a boolean expression.
`,
		},
		{
			code: `
const result = condition ? false : true;
`,
			output: `
const result = !condition;
`,
			snapshot: `
const result = condition ? false : true;
               ~~~~~~~~~~~~~~~~~~~~~~~~
               This ternary expression can be simplified to a boolean expression.
`,
		},
		{
			code: `
const result = isValid ? false : true;
`,
			output: `
const result = !isValid;
`,
			snapshot: `
const result = isValid ? false : true;
               ~~~~~~~~~~~~~~~~~~~~~~
               This ternary expression can be simplified to a boolean expression.
`,
		},
		{
			code: `
const result = (left === right) ? false : true;
`,
			output: `
const result = !(left === right);
`,
			snapshot: `
const result = (left === right) ? false : true;
               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
               This ternary expression can be simplified to a boolean expression.
`,
		},
		{
			code: `
const result = value ? value : defaultValue;
`,
			output: `
const result = value || defaultValue;
`,
			snapshot: `
const result = value ? value : defaultValue;
               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
               This ternary expression can be simplified to a logical operator.
`,
		},
		{
			code: `
const result = data ? data : fallback;
`,
			output: `
const result = data || fallback;
`,
			snapshot: `
const result = data ? data : fallback;
               ~~~~~~~~~~~~~~~~~~~~~~
               This ternary expression can be simplified to a logical operator.
`,
		},
		{
			code: `
const result = !value ? alternative : value;
`,
			output: `
const result = value || alternative;
`,
			snapshot: `
const result = !value ? alternative : value;
               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
               This ternary expression can be simplified to a logical operator.
`,
		},
		{
			code: `
const result = !data ? fallback : data;
`,
			output: `
const result = data || fallback;
`,
			snapshot: `
const result = !data ? fallback : data;
               ~~~~~~~~~~~~~~~~~~~~~~~
               This ternary expression can be simplified to a logical operator.
`,
		},
		{
			code: `
if (status === "active" ? true : false) {}
`,
			output: `
if (status === "active") {}
`,
			snapshot: `
if (status === "active" ? true : false) {}
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    This ternary expression can be simplified to a boolean expression.
`,
		},
		{
			code: `
return value > 0 ? true : false;
`,
			output: `
return value > 0;
`,
			snapshot: `
return value > 0 ? true : false;
       ~~~~~~~~~~~~~~~~~~~~~~~~
       This ternary expression can be simplified to a boolean expression.
`,
		},
		{
			code: `
const isActive = flag1 && flag2 ? true : false;
`,
			output: `
const isActive = flag1 && flag2;
`,
			snapshot: `
const isActive = flag1 && flag2 ? true : false;
                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                 This ternary expression can be simplified to a boolean expression.
`,
		},
		{
			code: `
const isInactive = flag1 || flag2 ? false : true;
`,
			output: `
const isInactive = !(flag1 || flag2);
`,
			snapshot: `
const isInactive = flag1 || flag2 ? false : true;
                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                   This ternary expression can be simplified to a boolean expression.
`,
		},
		{
			code: `
const result = func() ? false : true;
`,
			output: `
const result = !func();
`,
			snapshot: `
const result = func() ? false : true;
               ~~~~~~~~~~~~~~~~~~~~~
               This ternary expression can be simplified to a boolean expression.
`,
		},
		{
			code: `
const result = obj.prop ? false : true;
`,
			output: `
const result = !obj.prop;
`,
			snapshot: `
const result = obj.prop ? false : true;
               ~~~~~~~~~~~~~~~~~~~~~~~
               This ternary expression can be simplified to a boolean expression.
`,
		},
		{
			code: `
const result = arr[0] ? false : true;
`,
			output: `
const result = !arr[0];
`,
			snapshot: `
const result = arr[0] ? false : true;
               ~~~~~~~~~~~~~~~~~~~~~
               This ternary expression can be simplified to a boolean expression.
`,
		},
		{
			code: `
const result = nested ? nested : other;
`,
			output: `
const result = nested || other;
`,
			snapshot: `
const result = nested ? nested : other;
               ~~~~~~~~~~~~~~~~~~~~~~~
               This ternary expression can be simplified to a logical operator.
`,
		},
	],
	valid: [
		`const result = condition ? valueA : valueB;`,
		`const result = condition ? true : null;`,
		`const result = condition ? false : null;`,
		`const result = condition ? 1 : 0;`,
		`const result = condition ? "yes" : "no";`,
		`const result = isValid ? processValue() : null;`,
		`const result = data ? data.property : fallback;`,
		`const result = value ? value + 1 : defaultValue;`,
		`const result = condition ? someValue : otherValue;`,
		`const result = flag ? enabled : disabled;`,
		`const result = status === "active" ? "Running" : "Stopped";`,
	],
});
