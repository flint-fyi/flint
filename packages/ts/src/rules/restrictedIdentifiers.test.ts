import rule from "./restrictedIdentifiers.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const data = 1;
`,
			options: { deny: ["data"] },
			snapshot: `
const data = 1;
      ~~~~
      Identifier 'data' is restricted.
`,
		},
		{
			code: `
function data() {}
`,
			options: { deny: ["data"] },
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
			options: { deny: ["data"] },
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
			options: { deny: ["callback", "e"] },
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
			options: { deny: ["data"] },
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
			options: { deny: ["data"] },
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
			options: { deny: ["data"] },
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
			options: { deny: ["data"] },
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
			options: { deny: ["data"] },
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
