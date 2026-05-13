import rule from "./clientOnlyDirectiveValues.ts";
import { ruleTester } from "./ruleTester.ts";

const widgetFixture = {
	"Widget.svelte": "<div>Hello!</div>",
};

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
---
import Widget from "./Widget.svelte"
---

<Widget client:only />
`,
			files: widgetFixture,
			snapshot: `
---
import Widget from "./Widget.svelte"
---

<Widget client:only />
        ~~~~~~~~~~~
        \`client:only\` directives need a value so Astro knows which renderer to load.
`,
		},
		{
			code: `
---
import Widget from "./Widget.svelte"

function getRenderer() {
    return 0
}
---

<Widget client:only={getRenderer()} />
`,
			files: widgetFixture,
			snapshot: `
---
import Widget from "./Widget.svelte"

function getRenderer() {
    return 0
}
---

<Widget client:only={getRenderer()} />
        ~~~~~~~~~~~
        \`client:only\` values should be typed so they could resolve to a renderer hint string such as \`"react"\` or \`"svelte"\`.
`,
		},
		{
			code: `
---
import Widget from "./Widget.svelte"

let renderer: number | undefined = 0
---

<Widget client:only={renderer} />
`,
			files: widgetFixture,
			snapshot: `
---
import Widget from "./Widget.svelte"

let renderer: number | undefined = 0
---

<Widget client:only={renderer} />
        ~~~~~~~~~~~
        \`client:only\` values should be typed so they could resolve to a renderer hint string such as \`"react"\` or \`"svelte"\`.
`,
		},
	],
	valid: [
		{
			code: `
---
import Widget from "./Widget.svelte"
---

<Widget client:only="svelte" />
`,
			files: widgetFixture,
		},
		{
			code: `
---
import Widget from "./Widget.svelte"
---

<Widget client:only={"svelte"} />
`,
			files: widgetFixture,
		},
		{
			code: `
---
import Widget from "./Widget.svelte"

function getRenderer(): string {
    return "svelte"
}
---

<Widget client:only={getRenderer()} />
`,
			files: widgetFixture,
		},
		{
			code: `
---
import Widget from "./Widget.svelte"
---

<Widget client:only={\`svelte\`} />
`,
			files: widgetFixture,
		},
		{
			code: `
---
import Widget from "./Widget.svelte"

let renderer: string | undefined = Math.random() > 0.5 ? "svelte" : undefined
---

<Widget client:only={renderer} />
`,
			files: widgetFixture,
		},
		{
			code: `
---
import Widget from "./Widget.svelte"

const renderer: unknown = getRenderer()

function getRenderer() {
    return "svelte"
}
---

<Widget client:only={renderer} />
`,
			files: widgetFixture,
		},
		{
			code: `
---
import Widget from "./Widget.svelte"

let renderer = "svelte"
---

<Widget client:load={renderer} />
`,
			files: widgetFixture,
		},
	],
});
