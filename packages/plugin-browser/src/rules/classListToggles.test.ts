import rule from "./classListToggles.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
if (condition) {
    element.classList.add("active");
} else {
    element.classList.remove("active");
}
`,
			snapshot: `
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
if (isVisible) {
    button.classList.remove("hidden");
} else {
    button.classList.add("hidden");
}
`,
			snapshot: `
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
if (flag)
    element.classList.add("active");
else
    element.classList.remove("active");
`,
			snapshot: `
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
		`element.classList.toggle("active", condition);`,
		`element.classList.add("active");`,
		`element.classList.remove("active");`,
		`
			if (condition) {
				element.classList.add("active");
			}
		`,
		`
			if (condition) {
				element.classList.add("active");
			} else {
				element.classList.add("inactive");
			}
		`,
		`
			if (condition) {
				element.classList.add("active");
			} else {
				element.classList.remove("inactive");
			}
		`,
		`
			if (condition) {
				element.classList.add("active");
				console.log("added");
			} else {
				element.classList.remove("active");
			}
		`,
		`
			if (condition) {
				element.classList.add("class1");
			} else {
				element.classList.remove("class2");
			}
		`,
		`
			if (condition) {
				element1.classList.add("active");
			} else {
				element2.classList.remove("active");
			}
		`,
	],
});
