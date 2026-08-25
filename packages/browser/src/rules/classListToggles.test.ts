import rule from "./classListToggles.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const condition: boolean;
declare const element: HTMLElement;
if (condition) {
    element.classList.add("active");
} else {
    element.classList.remove("active");
}
`,
			output: `
declare const condition: boolean;
declare const element: HTMLElement;
element.classList.toggle("active", condition);
`,
			snapshot: `
declare const condition: boolean;
declare const element: HTMLElement;
if (condition) {
    element.classList.add("active");
                      ~~~
                      Prefer using \`classList.toggle()\` instead of conditional \`classList.add()\` and \`classList.remove()\`.
} else {
    element.classList.remove("active");
}
`,
		},
		{
			code: `
declare const isVisible: boolean;
declare const button: HTMLButtonElement;
if (isVisible) {
    button.classList.remove("hidden");
} else {
    button.classList.add("hidden");
}
`,
			output: `
declare const isVisible: boolean;
declare const button: HTMLButtonElement;
button.classList.toggle("hidden", !(isVisible));
`,
			snapshot: `
declare const isVisible: boolean;
declare const button: HTMLButtonElement;
if (isVisible) {
    button.classList.remove("hidden");
                     ~~~~~~
                     Prefer using \`classList.toggle()\` instead of conditional \`classList.add()\` and \`classList.remove()\`.
} else {
    button.classList.add("hidden");
}
`,
		},
		{
			code: `
declare const flag: boolean;
declare const element: HTMLElement;
if (flag)
    element.classList.add("active");
else
    element.classList.remove("active");
`,
			output: `
declare const flag: boolean;
declare const element: HTMLElement;
element.classList.toggle("active", flag);
`,
			snapshot: `
declare const flag: boolean;
declare const element: HTMLElement;
if (flag)
    element.classList.add("active");
                      ~~~
                      Prefer using \`classList.toggle()\` instead of conditional \`classList.add()\` and \`classList.remove()\`.
else
    element.classList.remove("active");
`,
		},
	],
	valid: [
		`
			declare const condition: boolean;
			declare const element: HTMLElement;
			element.classList.toggle("active", condition);
		`,
		`
			declare const element: HTMLElement;
			element.classList.add("active");
		`,
		`
			declare const element: HTMLElement;
			element.classList.remove("active");
		`,
		`
			declare const condition: boolean;
			declare const element: HTMLElement;
			if (condition) {
				element.classList.add("active");
			}
		`,
		`
			declare const condition: boolean;
			declare const element: HTMLElement;
			if (condition) {
				element.classList.add("active");
			} else {
				element.classList.add("inactive");
			}
		`,
		`
			declare const condition: boolean;
			declare const element: HTMLElement;
			if (condition) {
				element.classList.add("active");
			} else {
				element.classList.remove("inactive");
			}
		`,
		`
			declare const condition: boolean;
			declare const element: HTMLElement;
			if (condition) {
				element.classList.add("active");
				console.log("added");
			} else {
				element.classList.remove("active");
			}
		`,
		`
			declare const condition: boolean;
			declare const element: HTMLElement;
			if (condition) {
				element.classList.add("class1");
			} else {
				element.classList.remove("class2");
			}
		`,
		`
			declare const condition: boolean;
			declare const element1: HTMLElement;
			declare const element2: HTMLElement;
			if (condition) {
				element1.classList.add("active");
			} else {
				element2.classList.remove("active");
			}
		`,
	],
});
