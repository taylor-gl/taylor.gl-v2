<script lang="ts">
  import { page } from '$app/stores';
  import TextBubble from '../TextBubble.svelte';
  import 'iconify-icon';

  $: posts = $page.data.posts;
  $: tag = $page.data.tag;
</script>

<svelte:head>
  <title>{tag ? `Posts tagged "${tag}"` : 'Blog'} — Taylor G. Lunt</title>
</svelte:head>

<div class="min-h-screen bg-slate-100 px-4 py-12 dark:bg-slate-900">
  <div class="mx-auto max-w-3xl">
    <a
      href="/"
      class="mb-8 inline-block text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
      ><span aria-hidden="true">←</span> Back to home</a
    >
    <h1 class="mb-2 text-4xl font-bold text-slate-900 dark:text-slate-100">
      {tag ? `Posts tagged "${tag}"` : 'All Blog Posts'}
    </h1>
    <div class="mb-8">
      <a
        href="/rss.xml"
        class="text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >RSS (via Substack)</a
      >
    </div>
    <ul class="space-y-6">
      {#each posts as post (post.slug)}
        <li class="relative">
          {#if post.starred}
            <span class="sr-only">Starred post:</span>
            <iconify-icon
              icon="carbon:star-filled"
              class="absolute top-1 -left-8 text-xl text-pink-400"
              aria-hidden="true"
            ></iconify-icon>
          {/if}
          <a
            href={`/blog/${post.slug}`}
            class="text-2xl font-semibold text-slate-900 hover:underline dark:text-slate-100"
            style="view-transition-name: post-title-{post.slug}">{post.title}</a
          >
          <div class="mt-2 flex flex-wrap gap-2">
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
        </li>
      {/each}
    </ul>
  </div>
</div>
