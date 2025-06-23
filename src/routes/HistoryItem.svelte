<script>
  import { twMerge } from 'tailwind-merge';

  const { children, title, subtitle, subsubtitle, ...restProps } = $props();
</script>

<div
  class={twMerge(
    'w-full rounded-2xl border-2 border-slate-400 bg-slate-200/50 p-8 shadow-lg backdrop-blur-sm dark:border-white/15 dark:bg-slate-900',
    restProps.class
  )}
>
  <h2 class="text-2xl font-black">{title}</h2>

  <div class="my-1 block flex-row space-y-1 sm:flex">
    {#if subtitle}
      <h3>{subtitle}</h3>
    {/if}
    {#if subsubtitle}
      <span class="hidden sm:inline">&nbsp;—&nbsp;</span>
      <div class="italic">{subsubtitle}</div>
    {/if}
  </div>

  <div class="my-4">
    {@render children()}
  </div>
</div>
