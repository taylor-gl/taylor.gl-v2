<script lang="ts">
  import '../app.css';
  import { onNavigate } from '$app/navigation';
  import HeaderActions from '$lib/components/HeaderActions.svelte';
  import '$lib/stores/theme';

  const { children } = $props();

  onNavigate((navigation) => {
    if (!document.startViewTransition) {
      return;
    }

    return new Promise((resolve) => {
      document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });
</script>

<HeaderActions />

{@render children()}
