<script lang="ts">
	import { page } from '$app/stores';
	import { playPopSound } from '$lib/utils/sound';
	import TextBubble from '../../TextBubble.svelte';

	$: project = $page.data.project;
</script>

<svelte:head>
	<title>{project.title} — Taylor G. Lunt</title>
</svelte:head>

<div class="min-h-screen bg-slate-100 px-4 py-12 dark:bg-slate-900">
	<div class="mx-auto max-w-4xl">
		<a
			href="/projects"
			class="mb-4 inline-block text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
			rel="prev"><span aria-hidden="true">←</span> See all projects</a
		>
		<div class="mb-8">
			<h1
				class="relative z-30 mb-4 text-4xl font-bold text-slate-900 dark:text-slate-100"
				style="view-transition-name: project-title-{project.slug}"
			>
				{project.title}
			</h1>
			<div class="mb-6 flex flex-wrap gap-2">
				{#each project.technologies as tech (tech)}
					<div
						class="relative z-30"
						style="view-transition-name: project-tech-{project.slug}-{tech.replace(/\s+/g, '-')}"
					>
						<TextBubble size="sm" color="pink">{tech}</TextBubble>
					</div>
				{/each}
			</div>
		</div>

		<div class="mb-8 overflow-hidden rounded-2xl border-2 border-slate-400 dark:border-white/15">
			<img
				src="/images/{project.image}"
				alt="{project.title} screenshot"
				class="relative z-10 h-auto w-full object-cover"
				style="view-transition-name: project-image-{project.slug}"
			/>
		</div>

		<div class="mb-8 flex gap-4">
			{#if project.projectUrl}
				<button
					onclick={() => {
						playPopSound();
						window.open(project.projectUrl, '_blank', 'noopener,noreferrer');
					}}
					class="flex transform items-center gap-2 rounded-lg bg-teal-300 px-6 py-3 text-lg font-semibold text-teal-800 transition-all duration-150 hover:scale-105 hover:bg-teal-400 active:scale-100 active:bg-teal-300 dark:bg-teal-600 dark:text-teal-100 dark:hover:bg-teal-500 dark:active:bg-teal-600"
				>
					Try the Project
					<iconify-icon icon="carbon:launch" class="text-sm" aria-hidden="true"></iconify-icon>
				</button>
			{/if}
			{#if project.sourceUrl}
				<a
					href={project.sourceUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="flex items-center gap-2 text-lg font-semibold text-slate-600 underline hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
				>
					View Source Code
					<iconify-icon icon="carbon:launch" class="text-sm" aria-hidden="true"></iconify-icon>
				</a>
			{/if}
		</div>

		{#key project.slug}
			<div
				class="prose prose-xl prose-a:text-teal-600 prose-pre:whitespace-pre-wrap prose-code:whitespace-pre-wrap dark:prose-invert dark:prose-a:text-teal-300 max-w-none"
			>
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html project.content}
			</div>
		{/key}
	</div>
</div>
