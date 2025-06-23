<script lang="ts">
  import { page } from '$app/stores';
  import ProjectCard from '../ProjectCard.svelte';

  $: projects = $page.data.projects;
</script>

<svelte:head>
  <title>Projects — Taylor G. Lunt</title>
</svelte:head>

<div class="min-h-screen bg-slate-100 px-4 py-12 dark:bg-slate-900">
  <div class="mx-auto max-w-4xl">
    <a
      href="/"
      class="mb-4 inline-block text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
      rel="prev"><span aria-hidden="true">←</span> Back to home</a
    >
    <h1 class="mb-8 text-4xl font-bold text-slate-900 dark:text-slate-100">All Projects</h1>
    <div class="grid gap-8 md:grid-cols-2">
      {#each projects as project (project.slug)}
        <ProjectCard {project} size="large" />
      {/each}
    </div>
  </div>
</div>
