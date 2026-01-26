import rule from "./restrictedIdentifiers.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const data = 1;
`,
			snapshot: `
const data = 1;
      ~~~~
      Identifier 'data' is restricted.
`,
		},
		{
			code: `
let callback = () => {};
`,
			snapshot: `
let callback = () => {};
    ~~~~~~~~
    Identifier 'callback' is restricted.
`,
		},
		{
			code: `
function data() {}
`,
			snapshot: `
function data() {}
         ~~~~
         Identifier 'data' is restricted.
`,
		},
		{
			code: `
function fn(data) {}
`,
			snapshot: `
function fn(data) {}
            ~~~~
            Identifier 'data' is restricted.
`,
		},
		{
			code: `
function fn(callback, e) {}
`,
			snapshot: `
function fn(callback, e) {}
            ~~~~~~~~
            Identifier 'callback' is restricted.
                      ~
                      Identifier 'e' is restricted.
`,
		},
		{
			code: `
class data {}
`,
			snapshot: `
class data {}
      ~~~~
      Identifier 'data' is restricted.
`,
		},
		{
			code: `
import data from 'lib';
`,
			snapshot: `
import data from 'lib';
       ~~~~
       Identifier 'data' is restricted.
`,
		},
		{
			code: `
import { data } from 'lib';
`,
			snapshot: `
import { data } from 'lib';
         ~~~~
         Identifier 'data' is restricted.
`,
		},
		{
			code: `
import { foo as data } from 'lib';
`,
			snapshot: `
import { foo as data } from 'lib';
                ~~~~
                Identifier 'data' is restricted.
`,
		},
		{
			code: `
import * as data from 'lib';
`,
			snapshot: `
import * as data from 'lib';
            ~~~~
            Identifier 'data' is restricted.
`,
		},
	],
	valid: [
		`
const value = 1;
`,
		`
function handleData() {}
`,
		`
function fn(value) {}
`,
		`
import value from 'lib';
`,
		`
obj.data = 1;
`,
		`
const { data } = obj;
`,
	],
});
