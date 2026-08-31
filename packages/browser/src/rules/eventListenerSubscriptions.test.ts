import rule from "./eventListenerSubscriptions.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const element: HTMLElement;
declare const handler: EventListener;
element.onclick = handler;
`,
			snapshot: `
declare const element: HTMLElement;
declare const handler: EventListener;
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
window.onload = () => {
    console.log("loaded");
};
`,
			snapshot: `
window.onload = () => {
       ~~~~~~
       Prefer the multi-use \`addEventListener\` over assigning to the single-use \`onload\` property.
    console.log("loaded");
};
`,
		},
		{
			code: `
declare function handleKeypress(event: KeyboardEvent): void;
document.body.onkeypress = handleKeypress;
`,
			snapshot: `
declare function handleKeypress(event: KeyboardEvent): void;
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
declare function validate(value: unknown): void;
input.oninput = function (event) {
    validate((event.target as HTMLInputElement | null)?.value);
};
`,
			snapshot: `
declare const input: HTMLElement;
declare function validate(value: unknown): void;
input.oninput = function (event) {
      ~~~~~~~
      Prefer the multi-use \`addEventListener\` over assigning to the single-use \`oninput\` property.
    validate((event.target as HTMLInputElement | null)?.value);
};
`,
		},
		{
			code: `
declare const element: HTMLElement;
declare const handler: EventListener;
element.onmouseover = handler;
`,
			snapshot: `
declare const element: HTMLElement;
declare const handler: EventListener;
element.onmouseover = handler;
        ~~~~~~~~~~~
        Prefer the multi-use \`addEventListener\` over assigning to the single-use \`onmouseover\` property.
`,
		},
	],
	valid: [
		`
			declare const element: HTMLElement;
			declare const handler: EventListener;
			element.addEventListener("click", handler);
		`,
		`
			declare const button: HTMLButtonElement;
			button.addEventListener("mousedown", function () { console.log("clicked"); });
		`,
		`window.addEventListener("load", () => { console.log("loaded"); });`,
		`
			declare function handleKeypress(event: KeyboardEvent): void;
			document.body.addEventListener("keypress", handleKeypress);
		`,
		`
			declare const form: HTMLFormElement;
			form.addEventListener("submit", (event) => { event.preventDefault(); });
		`,
		`
			declare const element: HTMLElement;
			element.setAttribute("onclick", "handler()");
		`,
		`
			declare const element: HTMLElement;
			const elementOnclick = element.onclick;
		`,
		`const handler = { onclick: () => {} };`,
		`
			declare const obj: { customProperty: unknown };
			declare const value: unknown;
			obj.customProperty = value;
		`,
		`
			declare const element: HTMLElement;
			element.className = "active";
		`,
	],
});
