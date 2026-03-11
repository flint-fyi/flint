import "@flint.fyi/vue-language";

import rule from "../../../ts/src/rules/anyReturns.ts";
import { ruleTester } from "./ruleTester.ts";

const myComponentFixture = {
	"MyComponent.vue": `
<script lang="ts" setup>
defineProps<{ foo: () => string }>();
</script>

<template>Hello!</template>
	`,
};

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
<script lang="ts" setup>
	function foo() {
		return 1 as any
	}
</script>
			
`,
			snapshot: `
<script lang="ts" setup>
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
<script lang="ts" setup>
	import MyComponent from './MyComponent.vue'

	const foo = 1 as any
</script>

<template>
	<MyComponent :foo="() => foo"/>
</template>
			
`,
			files: myComponentFixture,
			snapshot: `
<script lang="ts" setup>
	import MyComponent from './MyComponent.vue'

	const foo = 1 as any
</script>

<template>
	<MyComponent :foo="() => foo"/>
	                         ~~~
	                         Unsafe return of a value of type \`any\`.
</template>
			
`,
		},
		{
			code: `
<script lang="ts" setup>
	import MyComponent from './MyComponent.vue'

	const foo = 1
</script>

<template>
	<MyComponent :foo="() => [
		foo,
		foo,
	] as any"/>
</template>
			
`,
			files: myComponentFixture,
			snapshot: `
<script lang="ts" setup>
	import MyComponent from './MyComponent.vue'

	const foo = 1
</script>

<template>
	<MyComponent :foo="() => [
	                         ~
	                         Unsafe return of a value of type \`any\`.
		foo,
		~~~~
		foo,
		~~~~
	] as any"/>
	~~~~~~~~
</template>
			
`,
		},
	],
	valid: [
		{
			code: `
<script lang="ts" setup>
	import MyComponent from './MyComponent.vue'

	function foo() {
		return MyComponent
	}
</script>
			`,
			files: myComponentFixture,
		},
	],
});
