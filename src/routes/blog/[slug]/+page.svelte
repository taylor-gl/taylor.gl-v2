<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import TextBubble from '../../TextBubble.svelte';

  $: post = $page.data.post;

  onMount(() => {
    const highlightFromHash = () => {
      document.querySelectorAll('.highlight').forEach((el) => el.classList.remove('highlight'));

      const { hash } = window.location;
      if (hash) {
        try {
          const target = document.querySelector(hash);
          if (target instanceof HTMLElement) {
            const elToHighlight = target.closest('p, li, h1, h2, h3, h4, h5, h6');
            elToHighlight?.classList.add('highlight');
          }
        } catch (e) {
          // Ignore invalid hash selectors
        }
      }
    };

    window.addEventListener('hashchange', highlightFromHash);
    highlightFromHash();

    return () => window.removeEventListener('hashchange', highlightFromHash);
  });
</script>

<svelte:head>
  <title>{post.title} — Taylor G. Lunt</title>
</svelte:head>

<div class="min-h-screen bg-slate-100 px-4 py-12 dark:bg-slate-900">
  <div class="mx-auto max-w-3xl">
    <a
      href="/blog"
      class="mb-4 inline-block text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
      rel="prev"><span aria-hidden="true">←</span> See all posts</a
    >
    <div>
      <h1
        class="mb-2 inline-block text-4xl font-bold text-slate-900 dark:text-slate-100"
        style="view-transition-name: post-title-{post.slug}"
      >
        {post.title}
      </h1>
    </div>
    <div class="mb-8 flex flex-wrap gap-2">
      {#each post.tags as tag (tag)}
        <a
          href="/blog/tag/{tag}"
          class="no-underline hover:underline focus:underline"
          style="view-transition-name: post-tag-{post.slug}-{tag}"
        >
          <TextBubble>{tag}</TextBubble>
        </a>
      {/each}
    </div>
    <div
      class="prose prose-xl prose-a:text-teal-600 prose-pre:whitespace-pre-wrap prose-code:whitespace-pre-wrap dark:prose-invert dark:prose-a:text-teal-300 max-w-none"
    >
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html post.content}
    </div>
  </div>
</div>

<style>
  :global(html) {
    @media (prefers-reduced-motion: no-preference) {
      scroll-behavior: smooth;
    }
  }

  @keyframes highlight-fade-dark {
    from {
      background: rgba(255, 255, 255, 0.15);
    }
  }

  @keyframes highlight-fade-light {
    from {
      background: rgba(0, 0, 0, 0.15);
    }
  }

  :global(.dark .highlight) {
    @media (prefers-reduced-motion: no-preference) {
      animation: highlight-fade-dark 2s ease-out;
    }
    background: rgba(255, 255, 255, 0.05);
  }

  :global(.highlight) {
    @media (prefers-reduced-motion: no-preference) {
      animation: highlight-fade-light 2s ease-out;
    }
    background: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
  }

  :global(li.highlight) {
    padding-inline: 0.5rem;
  }

  :global(
    p.highlight,
    h1.highlight,
    h2.highlight,
    h3.highlight,
    h4.highlight,
    h5.highlight,
    h6.highlight
  ) {
    padding-inline: 0.25rem;
  }

  :global(li:target, sup:target) {
    scroll-margin-top: 8rem;
  }
</style>
