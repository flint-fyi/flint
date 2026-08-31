import { ruleTester } from "./ruleTester.ts";
import rule from "./unnecessaryTernaries.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const condition = true;
const result = condition ? true : false;
`,
			output: `
const condition = true;
const result = condition;
`,
			snapshot: `
const condition = true;
const result = condition ? true : false;
               ~~~~~~~~~~~~~~~~~~~~~~~~
               This ternary expression can be simplified to a boolean expression.
`,
		},
		{
			code: `
const isValid = true;
const result = isValid ? true : false;
`,
			output: `
const isValid = true;
const result = isValid;
`,
			snapshot: `
const isValid = true;
const result = isValid ? true : false;
               ~~~~~~~~~~~~~~~~~~~~~~
               This ternary expression can be simplified to a boolean expression.
`,
		},
		{
			code: `
const condition = true;
const result = condition ? false : true;
`,
			output: `
const condition = true;
const result = !condition;
`,
			snapshot: `
const condition = true;
const result = condition ? false : true;
               ~~~~~~~~~~~~~~~~~~~~~~~~
               This ternary expression can be simplified to a boolean expression.
`,
		},
		{
			code: `
const isValid = true;
const result = isValid ? false : true;
`,
			output: `
const isValid = true;
const result = !isValid;
`,
			snapshot: `
const isValid = true;
const result = isValid ? false : true;
               ~~~~~~~~~~~~~~~~~~~~~~
               This ternary expression can be simplified to a boolean expression.
`,
		},
		{
			code: `
const left: number = 1;
const right: number = 2;
const result = (left === right) ? false : true;
`,
			output: `
const left: number = 1;
const right: number = 2;
const result = !(left === right);
`,
			snapshot: `
const left: number = 1;
const right: number = 2;
const result = (left === right) ? false : true;
               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
               This ternary expression can be simplified to a boolean expression.
`,
		},
		{
			code: `
const value = 1;
const defaultValue = 2;
const result = value ? value : defaultValue;
`,
			output: `
const value = 1;
const defaultValue = 2;
const result = value || defaultValue;
`,
			snapshot: `
const value = 1;
const defaultValue = 2;
const result = value ? value : defaultValue;
               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
               This ternary expression can be simplified to a logical operator.
`,
		},
		{
			code: `
const data = 1;
const fallback = 2;
const result = data ? data : fallback;
`,
			output: `
const data = 1;
const fallback = 2;
const result = data || fallback;
`,
			snapshot: `
const data = 1;
const fallback = 2;
const result = data ? data : fallback;
               ~~~~~~~~~~~~~~~~~~~~~~
               This ternary expression can be simplified to a logical operator.
`,
		},
		{
			code: `
const value = 1;
const alternative = 2;
const result = !value ? alternative : value;
`,
			output: `
const value = 1;
const alternative = 2;
const result = value || alternative;
`,
			snapshot: `
const value = 1;
const alternative = 2;
const result = !value ? alternative : value;
               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
               This ternary expression can be simplified to a logical operator.
`,
		},
		{
			code: `
const data = 1;
const fallback = 2;
const result = !data ? fallback : data;
`,
			output: `
const data = 1;
const fallback = 2;
const result = data || fallback;
`,
			snapshot: `
const data = 1;
const fallback = 2;
const result = !data ? fallback : data;
               ~~~~~~~~~~~~~~~~~~~~~~~
               This ternary expression can be simplified to a logical operator.
`,
		},
		{
			code: `
const status = "active";
if (status === "active" ? true : false) {}
`,
			output: `
const status = "active";
if (status === "active") {}
`,
			snapshot: `
const status = "active";
if (status === "active" ? true : false) {}
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    This ternary expression can be simplified to a boolean expression.
`,
		},
		{
			code: `
function test(value: number) {
    return value > 0 ? true : false;
}
`,
			output: `
function test(value: number) {
    return value > 0;
}
`,
			snapshot: `
function test(value: number) {
    return value > 0 ? true : false;
           ~~~~~~~~~~~~~~~~~~~~~~~~
           This ternary expression can be simplified to a boolean expression.
}
`,
		},
		{
			code: `
const flag1 = true;
const flag2 = false;
const isActive = flag1 && flag2 ? true : false;
`,
			output: `
const flag1 = true;
const flag2 = false;
const isActive = flag1 && flag2;
`,
			snapshot: `
const flag1 = true;
const flag2 = false;
const isActive = flag1 && flag2 ? true : false;
                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                 This ternary expression can be simplified to a boolean expression.
`,
		},
		{
			code: `
const flag1 = true;
const flag2 = false;
const isInactive = flag1 || flag2 ? false : true;
`,
			output: `
const flag1 = true;
const flag2 = false;
const isInactive = !(flag1 || flag2);
`,
			snapshot: `
const flag1 = true;
const flag2 = false;
const isInactive = flag1 || flag2 ? false : true;
                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                   This ternary expression can be simplified to a boolean expression.
`,
		},
		{
			code: `
function func() {
    return true;
}
const result = func() ? false : true;
`,
			output: `
function func() {
    return true;
}
const result = !func();
`,
			snapshot: `
function func() {
    return true;
}
const result = func() ? false : true;
               ~~~~~~~~~~~~~~~~~~~~~
               This ternary expression can be simplified to a boolean expression.
`,
		},
		{
			code: `
const obj = { prop: true };
const result = obj.prop ? false : true;
`,
			output: `
const obj = { prop: true };
const result = !obj.prop;
`,
			snapshot: `
const obj = { prop: true };
const result = obj.prop ? false : true;
               ~~~~~~~~~~~~~~~~~~~~~~~
               This ternary expression can be simplified to a boolean expression.
`,
		},
		{
			code: `
const arr = [true];
const result = arr[0] ? false : true;
`,
			output: `
const arr = [true];
const result = !arr[0];
`,
			snapshot: `
const arr = [true];
const result = arr[0] ? false : true;
               ~~~~~~~~~~~~~~~~~~~~~
               This ternary expression can be simplified to a boolean expression.
`,
		},
		{
			code: `
const nested = 1;
const other = 2;
const result = nested ? nested : other;
`,
			output: `
const nested = 1;
const other = 2;
const result = nested || other;
`,
			snapshot: `
const nested = 1;
const other = 2;
const result = nested ? nested : other;
               ~~~~~~~~~~~~~~~~~~~~~~~
               This ternary expression can be simplified to a logical operator.
`,
		},
	],
	valid: [
		`
const condition = true;
const valueA = 1;
const valueB = 2;
const result = condition ? valueA : valueB;
`,
		`
const condition = true;
const result = condition ? true : null;
`,
		`
const condition = true;
const result = condition ? false : null;
`,
		`
const condition = true;
const result = condition ? 1 : 0;
`,
		`
const condition = true;
const result = condition ? "yes" : "no";
`,
		`
const isValid = true;
function processValue() {
    return 1;
}
const result = isValid ? processValue() : null;
`,
		`
const data = { property: 1 };
const fallback = 2;
const result = data ? data.property : fallback;
`,
		`
const value = 1;
const defaultValue = 2;
const result = value ? value + 1 : defaultValue;
`,
		`
const condition = true;
const someValue = 1;
const otherValue = 2;
const result = condition ? someValue : otherValue;
`,
		`
const flag = true;
const enabled = 1;
const disabled = 2;
const result = flag ? enabled : disabled;
`,
		`
const status = "active";
const result = status === "active" ? "Running" : "Stopped";
`,
	],
});
