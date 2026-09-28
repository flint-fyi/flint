<script lang="ts">
	const typed: number = "text";
	function invalidated(): void {
		debugger;
	}
</script>

<button onclick={invalidated}>{typed}</button>
