import { ruleTester } from "./ruleTester.ts";
import rule from "./shadows.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const value = 3;
function example() {
    const value = 10;
}
`,
			snapshot: `
const value = 3;
function example() {
    const value = 10;
          ~~~~~
          Variable 'value' shadows a variable in an outer scope.
}
`,
		},
		{
			code: `
let count = 1;
function increment(count) {
    return count + 1;
}
`,
			snapshot: `
let count = 1;
function increment(count) {
                   ~~~~~
                   Variable 'count' shadows a variable in an outer scope.
    return count + 1;
}
`,
		},
		{
			code: `
let name = 'outer';
{
    let name = 'inner';
}
`,
			snapshot: `
let name = 'outer';
{
    let name = 'inner';
        ~~~~
        Variable 'name' shadows a variable in an outer scope.
}
`,
		},
		{
			code: `
function outer(item) {
    function inner() {
        let item = 5;
    }
}
`,
			snapshot: `
function outer(item) {
    function inner() {
        let item = 5;
            ~~~~
            Variable 'item' shadows a variable in an outer scope.
    }
}
`,
		},
		{
			code: `
const data = [1, 2, 3];
const result = data.map((data) => data * 2);
`,
			snapshot: `
const data = [1, 2, 3];
const result = data.map((data) => data * 2);
                         ~~~~
                         Variable 'data' shadows a variable in an outer scope.
`,
		},
		{
			code: `
let value = 1;
for (let value = 0; value < 10; value++) {
    console.log(value);
}
`,
			snapshot: `
let value = 1;
for (let value = 0; value < 10; value++) {
         ~~~~~
         Variable 'value' shadows a variable in an outer scope.
    console.log(value);
}
`,
		},
		{
			code: `
const index = 0;
for (const index of [1, 2, 3]) {
    console.log(index);
}
`,
			snapshot: `
const index = 0;
for (const index of [1, 2, 3]) {
           ~~~~~
           Variable 'index' shadows a variable in an outer scope.
    console.log(index);
}
`,
		},
		{
			code: `
const key = 'outer';
for (const key in { a: 1 }) {
    console.log(key);
}
`,
			snapshot: `
const key = 'outer';
for (const key in { a: 1 }) {
           ~~~
           Variable 'key' shadows a variable in an outer scope.
    console.log(key);
}
`,
		},
		{
			code: `
const error = new Error();
try {
    throw new Error();
} catch (error) {
    console.log(error);
}
`,
			snapshot: `
const error = new Error();
try {
    throw new Error();
} catch (error) {
         ~~~~~
         Variable 'error' shadows a variable in an outer scope.
    console.log(error);
}
`,
		},
		{
			code: `
class Widget {
    process(value) {
        const value = 10;
    }
}
`,
			snapshot: `
class Widget {
    process(value) {
        const value = 10;
              ~~~~~
              Variable 'value' shadows a variable in an outer scope.
    }
}
`,
		},
		{
			code: `
const { item } = obj;
function process({ item }) {
    return item;
}
`,
			snapshot: `
const { item } = obj;
function process({ item }) {
                   ~~~~
                   Variable 'item' shadows a variable in an outer scope.
    return item;
}
`,
		},
		{
			code: `
const [first] = array;
const processItem = ([first]) => first;
`,
			snapshot: `
const [first] = array;
const processItem = ([first]) => first;
                      ~~~~~
                      Variable 'first' shadows a variable in an outer scope.
`,
		},
		{
			code: `
function outer() {
    const value = 1;
    function inner() {
        const value = 2;
    }
}
`,
			snapshot: `
function outer() {
    const value = 1;
    function inner() {
        const value = 2;
              ~~~~~
              Variable 'value' shadows a variable in an outer scope.
    }
}
`,
		},
		{
			code: `
class Outer {}
function createClass() {
    class Outer {}
}
`,
			snapshot: `
class Outer {}
function createClass() {
    class Outer {}
          ~~~~~
          Variable 'Outer' shadows a variable in an outer scope.
}
`,
		},
		{
			code: `
function outer() {}
function createFunction() {
    function outer() {}
}
`,
			snapshot: `
function outer() {}
function createFunction() {
    function outer() {}
             ~~~~~
             Variable 'outer' shadows a variable in an outer scope.
}
`,
		},
	],
	valid: [
		`const value = 1;
function example() {
    const otherValue = 2;
}`,
		`const compute = function compute() {};`,
		`const Widget = class Widget {};`,
		`type Value = number;
function example() {
    const Value = 1;
}`,
		`interface Config {
    value: number;
}
function example() {
    const Config = {};
}`,
		`function example(value) {
    return value * 2;
}`,
		`const outer = 1;
function example() {
    const inner = 2;
    return inner;
}`,
		`class Widget {
    value = 1;
    getValue() {
        return this.value;
    }
}`,
		`const items = [1, 2, 3];
const results = items.map((item) => item * 2);`,
		`function process({ first, second }) {
    return first + second;
}`,
		`const [first, second] = [1, 2];`,
		`for (let index = 0; index < 10; index++) {
    console.log(index);
}`,
		`try {
    throw new Error();
} catch (error) {
    console.log(error);
}`,
	],
});
