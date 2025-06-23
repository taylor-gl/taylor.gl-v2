<script lang="ts">
  import type { Snippet } from 'svelte';
  import { onMount } from 'svelte';

  const { children, glowColor } = $props<{
    children: Snippet;
    glowColor: string;
  }>();

  let container: HTMLDivElement;
  let overlay: HTMLDivElement;

  onMount(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!container || !overlay) {
        return;
      }
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      overlay.style.setProperty('--glow-x', `${x}px`);
      overlay.style.setProperty('--glow-y', `${y}px`);
      overlay.style.setProperty('--glow-opacity', '1');
    };

    const handleMouseLeave = () => {
      if (!overlay) {
        return;
      }
      overlay.style.setProperty('--glow-opacity', '0');
    };

    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  });
</script>

<div bind:this={container} class="relative">
  {@render children()}
  <div bind:this={overlay} class="glow-overlay" style={`--glow-color: ${glowColor}`}>
    {@render children()}
  </div>
</div>
