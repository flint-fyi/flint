import rule from "./nodeQueryMethods.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
document.getElementById("foo");
`,
			snapshot: `
document.getElementById("foo");
         ~~~~~~~~~~~~~~
         Prefer \`querySelector()\` over the legacy \`getElementById()\` method.
`,
		},
		{
			code: `
document.getElementsByClassName("bar");
`,
			snapshot: `
document.getElementsByClassName("bar");
         ~~~~~~~~~~~~~~~~~~~~~~
         Prefer \`querySelectorAll()\` over the legacy \`getElementsByClassName()\` method.
`,
		},
		{
			code: `
document.getElementsByTagName("div");
`,
			snapshot: `
document.getElementsByTagName("div");
         ~~~~~~~~~~~~~~~~~~~~
         Prefer \`querySelectorAll()\` over the legacy \`getElementsByTagName()\` method.
`,
		},
		{
			code: `
document.getElementsByTagNameNS("http://www.w3.org/1999/xhtml", "div");
`,
			snapshot: `
document.getElementsByTagNameNS("http://www.w3.org/1999/xhtml", "div");
         ~~~~~~~~~~~~~~~~~~~~~~
         Prefer \`querySelectorAll()\` over the legacy \`getElementsByTagNameNS()\` method.
`,
		},
		{
			code: `
const element = document.body;
element.getElementsByClassName("test");
`,
			snapshot: `
const element = document.body;
element.getElementsByClassName("test");
        ~~~~~~~~~~~~~~~~~~~~~~
        Prefer \`querySelectorAll()\` over the legacy \`getElementsByClassName()\` method.
`,
		},
		{
			code: `
const element = document.querySelector("#root");
element.getElementsByTagName("span");
`,
			snapshot: `
const element = document.querySelector("#root");
element.getElementsByTagName("span");
        ~~~~~~~~~~~~~~~~~~~~
        Prefer \`querySelectorAll()\` over the legacy \`getElementsByTagName()\` method.
`,
		},
	],
	valid: [
		`document.querySelector("#foo");`,
		`document.querySelectorAll(".bar");`,
		`document.querySelectorAll("div");`,
		`element.querySelector("span");`,
		`element.querySelectorAll(".test");`,
		`
            const myObject = {
                getElementById(id: string) {
                    return null;
                }
            };
            myObject.getElementById("test");
        `,
	],
});
