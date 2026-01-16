import rule from "./keyboardEventKeys.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
window.addEventListener("keydown", (event: KeyboardEvent) => {
    console.log(event.keyCode);
});
`,
			snapshot: `
window.addEventListener("keydown", (event: KeyboardEvent) => {
    console.log(event.keyCode);
                      ~~~~~~~
                      Prefer \`KeyboardEvent.key\` over the deprecated \`keyCode\` property.
});
`,
		},
		{
			code: `
declare const unrelated: { addEventListener: (...args: unknown[]) => void };
unrelated.addEventListener("keydown", (event: KeyboardEvent) => {
    console.log(event.keyCode);
});
`,
			snapshot: `
declare const unrelated: { addEventListener: (...args: unknown[]) => void };
unrelated.addEventListener("keydown", (event: KeyboardEvent) => {
    console.log(event.keyCode);
                      ~~~~~~~
                      Prefer \`KeyboardEvent.key\` over the deprecated \`keyCode\` property.
});
`,
		},
		{
			code: `
window.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.keyCode === 13) {
        console.log("Enter pressed");
    }
});
`,
			snapshot: `
window.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.keyCode === 13) {
              ~~~~~~~
              Prefer \`KeyboardEvent.key\` over the deprecated \`keyCode\` property.
        console.log("Enter pressed");
    }
});
`,
		},
		{
			code: `
document.addEventListener("keypress", (event: KeyboardEvent) => {
    console.log(event.charCode);
});
`,
			snapshot: `
document.addEventListener("keypress", (event: KeyboardEvent) => {
    console.log(event.charCode);
                      ~~~~~~~~
                      Prefer \`KeyboardEvent.key\` over the deprecated \`charCode\` property.
});
`,
		},
		{
			code: `
document.addEventListener("keyup", (event: KeyboardEvent) => {
    console.log(event.which);
});
`,
			// only: true,
			snapshot: `
document.addEventListener("keyup", (event: KeyboardEvent) => {
    console.log(event.which);
                      ~~~~~
                      Prefer \`KeyboardEvent.key\` over the deprecated \`which\` property.
});
`,
		},
		{
			code: `
function handleKeyDown(event: KeyboardEvent) {
    return event.keyCode === 8;
}
`,
			// only: true,
			snapshot: `
function handleKeyDown(event: KeyboardEvent) {
    return event.keyCode === 8;
                 ~~~~~~~
                 Prefer \`KeyboardEvent.key\` over the deprecated \`keyCode\` property.
}
`,
		},
	],
	valid: [
		`
declare const unrelated: { addEventListener: (...args: unknown[]) => void };
unrelated.addEventListener("keydown", (event: { keyCode: string }) => {
    console.log(event.keyCode);
});
`,
		`
window.addEventListener("keydown", (event: KeyboardEvent) => {
    console.log(event.key);
});
`,
		`
window.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Enter") {
        console.log("Enter pressed");
    }
});
`,
		`
document.addEventListener("keypress", (event: KeyboardEvent) => {
    console.log(event.key);
});
`,
		`
window.addEventListener("click", (event: MouseEvent) => {
    console.log(event.which);
});
`,
		`
const obj = { keyCode: 13 };
console.log(obj.keyCode);
`,
	],
});
