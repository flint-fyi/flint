import "@flint.fyi/svelte-language";

import rule from "../../../ts/src/rules/anyReturns.ts";
import { ruleTester } from "./ruleTester.ts";

const myComponentFixture = {
	"MyComponent.svelte": "<div>Hello!</div>",
};

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
<script lang="ts">
	function foo() {
		return 1 as any
	}
</script>
`,
			snapshot: `
<script lang="ts">
	function foo() {
		return 1 as any
		~~~~~~~~~~~~~~~
		Unsafe return of a value of type \`any\`.
	}
</script>
`,
		},
		{
			code: `
<script lang="ts">
	let foo = {} as any
</script>

<button onclick={() => foo}></button>
`,
			snapshot: `
<script lang="ts">
	let foo = {} as any
</script>

<button onclick={() => foo}></button>
                       ~~~
                       Unsafe return of a value of type \`any\`.
`,
		},
	],
	valid: [
		{
			code: `
<script lang="ts">
	import MyComponent from "./MyComponent.svelte"
	
	function foo() {
		return MyComponent
	}
</script>
`,
			files: myComponentFixture,
		},
	],
});
