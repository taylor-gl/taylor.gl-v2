<script>
  let { children } = $props();
</script>

<svelte:head>
  <link rel="stylesheet" href="board-games/tufte.css" />
  <link rel="stylesheet" href="board-games/globals.css" />
</svelte:head>

{@render children?.()}
