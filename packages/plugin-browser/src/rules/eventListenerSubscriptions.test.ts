import rule from "./eventListenerSubscriptions.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const element: HTMLElement;
element.onclick = handler;
`,
			snapshot: `
declare const element: HTMLElement;
element.onclick = handler;
        ~~~~~~~
        Prefer the multi-use \`addEventListener\` over assigning to the single-use \`onclick\` property.
`,
		},
		{
			code: `
declare const button: HTMLElement;
button.onmousedown = function () {
    console.log("clicked");
};
`,
			snapshot: `
declare const button: HTMLElement;
button.onmousedown = function () {
       ~~~~~~~~~~~
       Prefer the multi-use \`addEventListener\` over assigning to the single-use \`onmousedown\` property.
    console.log("clicked");
};
`,
		},
		{
			code: `
declare const window: HTMLElement;
window.onload = () => {
    console.log("loaded");
};
`,
			snapshot: `
declare const window: HTMLElement;
window.onload = () => {
       ~~~~~~
       Prefer the multi-use \`addEventListener\` over assigning to the single-use \`onload\` property.
    console.log("loaded");
};
`,
		},
		{
			code: `
declare const document: HTMLElement;
document.body.onkeypress = handleKeypress;
`,
			snapshot: `
declare const document: HTMLElement;
document.body.onkeypress = handleKeypress;
              ~~~~~~~~~~
              Prefer the multi-use \`addEventListener\` over assigning to the single-use \`onkeypress\` property.
`,
		},
		{
			code: `
declare const form: HTMLElement;
form.onsubmit = (event) => {
    event.preventDefault();
};
`,
			snapshot: `
declare const form: HTMLElement;
form.onsubmit = (event) => {
     ~~~~~~~~
     Prefer the multi-use \`addEventListener\` over assigning to the single-use \`onsubmit\` property.
    event.preventDefault();
};
`,
		},
		{
			code: `
declare const video: HTMLElement;
video.onpause = () => console.log("paused");
`,
			snapshot: `
declare const video: HTMLElement;
video.onpause = () => console.log("paused");
      ~~~~~~~
      Prefer the multi-use \`addEventListener\` over assigning to the single-use \`onpause\` property.
`,
		},
		{
			code: `
declare const input: HTMLElement;
input.oninput = function (event) {
    validate(event.target.value);
};
`,
			snapshot: `
declare const input: HTMLElement;
input.oninput = function (event) {
      ~~~~~~~
      Prefer the multi-use \`addEventListener\` over assigning to the single-use \`oninput\` property.
    validate(event.target.value);
};
`,
		},
		{
			code: `
declare const element: HTMLElement;
element.onmouseover = handler;
`,
			snapshot: `
declare const element: HTMLElement;
element.onmouseover = handler;
        ~~~~~~~~~~~
        Prefer the multi-use \`addEventListener\` over assigning to the single-use \`onmouseover\` property.
`,
		},
	],
	valid: [
		`element.addEventListener("click", handler);`,
		`button.addEventListener("mousedown", function () { console.log("clicked"); });`,
		`window.addEventListener("load", () => { console.log("loaded"); });`,
		`document.body.addEventListener("keypress", handleKeypress);`,
		`form.addEventListener("submit", (event) => { event.preventDefault(); });`,
		`element.setAttribute("onclick", "handler()");`,
		`const onclick = element.onclick;`,
		`const handler = { onclick: () => {} };`,
		`obj.customProperty = value;`,
		`element.className = "active";`,
	],
});
