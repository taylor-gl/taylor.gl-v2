<script lang="ts">
	import type { Project } from '$lib/projects';
	import TextBubble from './TextBubble.svelte';

	const { project, size = 'normal' } = $props<{ project: Project; size?: 'normal' | 'large' }>();

	const cardHeight = size === 'large' ? 'h-96' : 'h-80';
</script>

<div class="block no-underline">
	<article
		class="group relative flex {cardHeight} flex-col overflow-hidden rounded-2xl border-2 border-slate-400 bg-slate-200/50 shadow-lg backdrop-blur-sm dark:border-white/15 dark:bg-slate-900"
	>
		<div class="relative h-full w-full bg-slate-300 dark:bg-slate-700">
			<img
				src="/images/{project.image}"
				alt="{project.title} screenshot"
				class="relative z-10"
				style="view-transition-name: project-image-{project.slug}; height: 100%; width: 100%; object-fit: cover;"
			/>
			<div
				class="absolute inset-x-0 bottom-0 z-15 h-1/2 bg-gradient-to-t from-slate-200 to-transparent dark:from-slate-900 dark:to-transparent"
			></div>
		</div>
		<div class="absolute right-0 bottom-0 left-0 z-20 p-4 text-slate-800 dark:text-white">
			<h3
				class="relative z-30 mb-2 text-lg font-bold"
				style="view-transition-name: project-title-{project.slug}"
			>
				{project.title}
			</h3>
			<p
				class="relative z-30 mb-3 text-sm opacity-90"
				style="view-transition-name: project-description-{project.slug}"
			>
				{project.description}
			</p>
			<div class="flex items-center justify-between">
				<div class="flex-1 overflow-hidden">
					<div
						class="flex gap-2"
						style="mask: linear-gradient(to right, black 85%, transparent 100%); -webkit-mask: linear-gradient(to right, black 85%, transparent 100%);"
					>
						{#each project.technologies as tech (tech)}
							<div
								style="view-transition-name: project-tech-{project.slug}-{tech.replace(
									/\s+/g,
									'-'
								)}"
								class="relative z-30 flex-shrink-0"
							>
								<TextBubble size="sm" color="pink">{tech}</TextBubble>
							</div>
						{/each}
					</div>
				</div>
				<div class="ml-4 flex gap-3">
					<a
						href="/projects/{project.slug}"
						class="text-sm text-slate-600 underline hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
					>
						write-up
					</a>
					{#if project.projectUrl}
						<a
							href={project.projectUrl}
							target="_blank"
							rel="noopener noreferrer"
							class="flex items-center gap-1 text-sm text-teal-600 underline hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-200"
						>
							try it
							<iconify-icon icon="carbon:launch" class="text-xs" aria-hidden="true"></iconify-icon>
						</a>
					{/if}
					{#if project.sourceUrl}
						<a
							href={project.sourceUrl}
							target="_blank"
							rel="noopener noreferrer"
							class="flex items-center gap-1 text-sm text-slate-600 underline hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
						>
							view source
							<iconify-icon icon="carbon:launch" class="text-xs" aria-hidden="true"></iconify-icon>
						</a>
					{/if}
				</div>
			</div>
		</div>
	</article>
</div>
