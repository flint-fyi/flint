import rule from "./unnecessaryBind.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `const handler = function() {
    console.log("hello");
}.bind(this);`,
			snapshot: `const handler = function() {
                ~~~~~~~~~~~~
                The .bind() call is unnecessary.
    console.log("hello");
    ~~~~~~~~~~~~~~~~~~~~~
}.bind(this);
~~~~~~~~~~~~`,
		},
		{
			code: `const fn = function(x: number) {
    return x * 2;
}.bind(context);`,
			snapshot: `const fn = function(x: number) {
           ~~~~~~~~~~~~~~~~~~~~~
           The .bind() call is unnecessary.
    return x * 2;
    ~~~~~~~~~~~~~
}.bind(context);
~~~~~~~~~~~~~~~`,
		},
		{
			code: `const arrow = (() => {
    console.log("hello");
}).bind(this);`,
			snapshot: `const arrow = (() => {
              ~~~~~~~~
              Do not use .bind() on arrow functions.
    console.log("hello");
    ~~~~~~~~~~~~~~~~~~~~~
}).bind(this);
~~~~~~~~~~~~~`,
		},
		{
			code: `const arrowWithThis = (() => {
    this.foo();
}).bind(context);`,
			snapshot: `const arrowWithThis = (() => {
                      ~~~~~~~~
                      Do not use .bind() on arrow functions.
    this.foo();
    ~~~~~~~~~~~
}).bind(context);
~~~~~~~~~~~~~~~~`,
		},
	],
	valid: [
		`const handler = function() {
    this.handleClick();
}.bind(this);`,
		`const fn = function() {
    return this.value * 2;
}.bind(context);`,
		`const regular = function() {
    console.log("hello");
};`,
		`const arrow = () => {
    console.log("hello");
};`,
		`obj.method.bind(obj);`,
		`fn.bind(context, arg1, arg2);`,
	],
});
