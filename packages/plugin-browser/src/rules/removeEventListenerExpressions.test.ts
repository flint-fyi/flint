import rule from "./removeEventListenerExpressions.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const element: HTMLElement;
element.removeEventListener("click", () => {});
`,
			snapshot: `
declare const element: HTMLElement;
element.removeEventListener("click", () => {});
                                     ~~~~~~~~
                                     Inline function expressions in \`removeEventListener\` calls will not remove the original listener.
`,
		},
		{
			code: `
declare const element: HTMLElement;
element.removeEventListener("click", function () {});
`,
			snapshot: `
declare const element: HTMLElement;
element.removeEventListener("click", function () {});
                                     ~~~~~~~~~~~~~~
                                     Inline function expressions in \`removeEventListener\` calls will not remove the original listener.
`,
		},
		{
			code: `
declare const element: HTMLElement;
element.removeEventListener("click", () => console.log("clicked"));
`,
			snapshot: `
declare const element: HTMLElement;
element.removeEventListener("click", () => console.log("clicked"));
                                     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                                     Inline function expressions in \`removeEventListener\` calls will not remove the original listener.
`,
		},
		{
			code: `
declare const element: HTMLElement;
document.getElementById("button").removeEventListener("mouseover", function handler() {
    console.log("hover");
});
`,
			snapshot: `
declare const element: HTMLElement;
document.getElementById("button").removeEventListener("mouseover", function handler() {
                                                                   ~~~~~~~~~~~~~~~~~~~~
                                                                   Inline function expressions in \`removeEventListener\` calls will not remove the original listener.
    console.log("hover");
    ~~~~~~~~~~~~~~~~~~~~~
});
~
`,
		},
		{
			code: `
declare const element: HTMLElement;
window.removeEventListener("resize", () => resize());
`,
			snapshot: `
declare const element: HTMLElement;
window.removeEventListener("resize", () => resize());
                                     ~~~~~~~~~~~~~~
                                     Inline function expressions in \`removeEventListener\` calls will not remove the original listener.
`,
		},
	],
	valid: [
		`
declare const element: HTMLElement;
element.removeEventListener("click", null);
`,
		`
declare const element: HTMLElement;
element.removeEventListener("click");
`,
		`
declare const element: HTMLElement;
element.removeEventListener("click", handler);
`,
		`
declare const element: HTMLElement;
element.removeEventListener("click", this.handler);
`,
		`
declare const element: HTMLElement;
element.removeEventListener("click", obj.handler);
`,
		`
declare const element: HTMLElement;
element.addEventListener("click", handler);
`,
		`
declare const element: HTMLElement;
const handler = () => console.log("clicked");
element.removeEventListener("click", handler);`,
		`
declare const element: HTMLElement;
function handler() { console.log("clicked"); }
element.removeEventListener("click", handler);`,
		`
declare const other: { removeEventListener: (...args: unknown) => void };
other.removeEventListener("click", null);
`,
	],
});
