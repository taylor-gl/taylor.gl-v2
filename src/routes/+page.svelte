<script lang="ts">
  import { onMount } from 'svelte';
  import { blur } from 'svelte/transition';
  import MadLib from '$lib/MadLib.svelte';
  import type { Project } from '$lib/projects';
  import type { BlogPost, MadLibPick } from '$lib/types';
  import { playPopSound } from '$lib/utils/sound';
  import ArrowHead from './ArrowHead.svelte';
  import ArrowSection from './ArrowSection.svelte';
  import ArrowTail from './ArrowTail.svelte';
  import GlowButton from './GlowButton.svelte';
  import HistoryItem from './HistoryItem.svelte';
  import HistorySection from './HistorySection.svelte';
  import ProjectCard from './ProjectCard.svelte';
  import TextBubble from './TextBubble.svelte';

  const PASSIONATE_ADJECTIVES = [
    'passionate',
    'ardent',
    'zesty',
    'enthusiastic',
    'happy',
    'plucky',
    'bananas',
    'jittery',
    'drowsy',
    'dainty',
  ];

  const LOVELY_ADJECTIVES = [
    'lovely',
    'elegant',
    'delightful',
    'charming',
    'efficient',
    'sophisticated',
    'windy',
    'slick',
    'frosty',
    'tangy',
  ];

  const MOUNTAINS_NOUNS = [
    'mountains',
    'heaps',
    'loads',
    'tons',
    'jungles',
    'constellations',
    'caverns',
    'festivals',
    'planets',
    'pickles',
  ];

  const EXPLORED_VERBS = [
    'Explored',
    'Questioned',
    'Uncovered',
    'Surveyed',
    'Read',
    'Gauged',
    'Illuminated',
    'Mapped',
    'Modeled',
    'Danced with',
  ];

  const THINK_VERBS = [
    'think',
    'reason',
    'understand',
    'act',
    'hallucinate',
    'collapse',
    'dream',
    'fail',
    'succeed',
    'deduce',
  ];

  const CHALLENGING_ADJECTIVES = [
    'challenging',
    'stressful',
    'brutal',
    'boring',
    'exciting',
    'transformative',
    'suffocating',
    'thrilling',
    'interesting',
    'educational',
  ];

  const PROJECTS_TITLES = [
    'Projects',
    'Portfolio',
    'Work',
    'Showcase',
    'Creations',
    'Experiments',
    'Demos',
    "Things I've Built",
    'Toys',
    'Apps',
  ];

  const BLOG_TITLES = [
    'Blog',
    'Journal',
    'Chronicles',
    'Diary',
    'Column',
    'Posts',
    'Rants',
    "Things I've Written",
    'Write-Ups',
    'Articles',
  ];

  interface BlogPost {
    slug: string;
    title: string;
    preview: string;
    tags: string[];
  }

  const { data } = $props();

  let justCopied = $state(false);
  let justDownloaded = $state(false);
  let justCopiedSocial = $state(false);
  let socialCopyLabel = $state('Copy Email Address');
  let prefersReducedMotion = $state(false);

  onMount(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    prefersReducedMotion = mediaQuery.matches;
    const listener = (e: { matches: boolean }) => (prefersReducedMotion = e.matches);
    mediaQuery.addEventListener('change', listener);

    return () => {
      mediaQuery.removeEventListener('change', listener);
    };
  });

  const getArticle = (word: string) => (/^[aeiou]/i.test(word) ? 'an' : 'a');

  let passionateWord = $state(PASSIONATE_ADJECTIVES[data.madLibPicks[0] ?? 0]);
  let lovelyWord1 = $state(LOVELY_ADJECTIVES[data.madLibPicks[1] ?? 0]);
  let lovelyWord2 = $state(LOVELY_ADJECTIVES[data.madLibPicks[2] ?? 0]);
  let mountainsWord = $state(MOUNTAINS_NOUNS[data.madLibPicks[3] ?? 0]);
  let lovelyWord3 = $state(LOVELY_ADJECTIVES[data.madLibPicks[4] ?? 0]);
  let lovelyWord4 = $state(LOVELY_ADJECTIVES[data.madLibPicks[5] ?? 0]);
  let exploredWord = $state(EXPLORED_VERBS[data.madLibPicks[6] ?? 0]);
  let thinkWord = $state(THINK_VERBS[data.madLibPicks[7] ?? 0]);
  let challengingWord = $state(CHALLENGING_ADJECTIVES[data.madLibPicks[8] ?? 0]);
  let blogTitle = $state(BLOG_TITLES[data.madLibPicks[9] ?? 0]);
  let projectsTitle = $state('Projects');

  const blogPosts: BlogPost[] = data.blogPosts.map((post: BlogPost) => ({
    ...post,
    tags: post.tags || [],
  }));

  const projects: Project[] = data.projects;

  const copyEmailToClipboard = () => {
    if (!justCopied) {
      playPopSound();
      navigator.clipboard.writeText('taylor@taylor.gl');
      justCopied = true;
      setTimeout(() => (justCopied = false), 1000);
    }
  };

  const copyEmailToClipboardSocial = () => {
    if (!justCopiedSocial) {
      playPopSound();
      navigator.clipboard.writeText('taylor@taylor.gl');
      justCopiedSocial = true;
      socialCopyLabel = 'Email address copied!';
      setTimeout(() => {
        justCopiedSocial = false;
        socialCopyLabel = 'Copy Email Address';
      }, 1000);
    }
  };

  const downloadResume = () => {
    if (!justDownloaded) {
      playPopSound();
      const link = document.createElement('a');
      link.href = '/Taylor_G_Lunt_Resume.pdf';
      link.download = '/Taylor_G_Lunt_Resume.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      justDownloaded = true;
      setTimeout(() => (justDownloaded = false), 1000);
    }
  };
</script>

<svelte:head>
  <title>Taylor G. Lunt</title>
</svelte:head>

<main class="relative min-h-screen fill-current">
  <div class="fixed inset-0 bg-slate-100 bg-[url('/graph-paper-light.svg')] dark:hidden"></div>
  <div class="fixed inset-0 hidden bg-slate-900 bg-[url('/graph-paper-dark.svg')] dark:block"></div>

  <div class="relative z-10 text-slate-800 dark:text-slate-300">
    <section class="mx-auto max-w-[800px] p-8 text-center sm:p-16">
      <div class="relative mx-auto mb-4 h-64 w-64">
        <div
          class="absolute inset-0 rounded-full border-4 border-slate-900/20 dark:border-slate-100/20"
        ></div>
        <img
          src="/portrait.png"
          alt="A portrait of Taylor G. Lunt"
          class="h-full w-full rounded-full object-cover"
        />
      </div>
      <h1 class="text-7xl/30 font-black">
        <span class="font-display text-slate-900 dark:text-slate-100">Taylor G. Lunt</span>
      </h1>
      <div class="text-2xl/12 font-bold tracking-wider">
        I'm
        <span>{getArticle(passionateWord ?? '')}</span>
        <MadLib
          word={passionateWord ?? ''}
          wordList={PASSIONATE_ADJECTIVES}
          onWordChange={(word: string) => (passionateWord = word)}
        />
        Full-Stack Developer who builds
        <MadLib
          word={lovelyWord1 ?? ''}
          wordList={LOVELY_ADJECTIVES}
          onWordChange={(word: string) => (lovelyWord1 = word)}
        />,
        <MadLib
          word={lovelyWord2 ?? ''}
          wordList={LOVELY_ADJECTIVES}
          onWordChange={(word: string) => (lovelyWord2 = word)}
        />, software.
      </div>
    </section>

    <section class="mx-auto flex max-w-[800px] flex-col items-center gap-8 px-8 text-center">
      <GlowButton onClick={copyEmailToClipboard}>
        <div class="grid" aria-live="polite">
          {#if justCopied}
            <div
              class="col-start-1 col-end-2 row-start-1 row-end-2"
              out:blur={prefersReducedMotion ? { duration: 0 } : { duration: 500 }}
            >
              <span>Copied!</span>
            </div>
          {:else}
            <div
              class="col-start-1 col-end-2 row-start-1 row-end-2"
              in:blur={prefersReducedMotion ? { duration: 0 } : { delay: 500, duration: 1000 }}
            >
              <iconify-icon
                icon="carbon:email"
                class="pr-2 align-middle text-2xl"
                aria-hidden="true"
              ></iconify-icon>
              <span>Copy my Email Address</span>
            </div>
          {/if}
        </div>
      </GlowButton>
      <GlowButton onClick={downloadResume}>
        <div class="grid" aria-live="polite">
          {#if justDownloaded}
            <div
              class="col-start-1 col-end-2 row-start-1 row-end-2"
              out:blur={prefersReducedMotion ? { duration: 0 } : { duration: 500 }}
            >
              <span>Downloaded!</span>
            </div>
          {:else}
            <div
              class="col-start-1 col-end-2 row-start-1 row-end-2"
              in:blur={prefersReducedMotion ? { duration: 0 } : { delay: 500, duration: 1000 }}
            >
              <iconify-icon
                icon="carbon:document-pdf"
                class="pr-2 align-middle text-2xl"
                aria-hidden="true"
              ></iconify-icon>
              <span>Download my Resume</span>
            </div>
          {/if}
        </div>
      </GlowButton>
    </section>

    <section class="mx-auto max-w-[800px] px-8 py-2">
      <HistorySection class="py-12">
        <ArrowHead />
        <ArrowSection />
        <HistoryItem
          title="Beaverlabs (Current)"
          subtitle="Full-Stack Developer"
          subsubtitle="4 Years"
        >
          <div>
            Turning
            <MadLib
              word={mountainsWord ?? ''}
              wordList={MOUNTAINS_NOUNS}
              onWordChange={(word: string) => (mountainsWord = word)}
            />
            of marine vessel data into
            <MadLib
              word={lovelyWord3 ?? ''}
              wordList={LOVELY_ADJECTIVES}
              onWordChange={(word: string) => (lovelyWord3 = word)}
            />,
            <MadLib
              word={lovelyWord4 ?? ''}
              wordList={LOVELY_ADJECTIVES}
              onWordChange={(word: string) => (lovelyWord4 = word)}
            />
            web dashboards.
          </div>
          <div class="mt-8 flex flex-row flex-wrap gap-2">
            <TextBubble>React</TextBubble>
            <TextBubble>TypeScript</TextBubble>
            <TextBubble>HTML & CSS</TextBubble>
            <TextBubble>Elixir</TextBubble>
            <TextBubble>Postgresql</TextBubble>
            <TextBubble>Elasticsearch</TextBubble>
          </div>
        </HistoryItem>
        <ArrowSection />
        <HistoryItem
          title="University of Toronto"
          subtitle="Bachelor of Science"
          subsubtitle="Double Major in Psychology and Computer Science"
        >
          <MadLib
            word={exploredWord ?? ''}
            wordList={EXPLORED_VERBS}
            onWordChange={(word: string) => (exploredWord = word)}
          />
          how humans and machines
          <MadLib
            word={thinkWord ?? ''}
            wordList={THINK_VERBS}
            onWordChange={(word: string) => (thinkWord = word)}
          />.
        </HistoryItem>
        <ArrowSection />
        <HistoryItem
          title="Lindsay Thurber Comprehensive High School"
          subtitle="High School Diploma & I.B. Diploma Programme"
          subsubtitle=""
        >
          Completed the
          <MadLib
            word={challengingWord ?? ''}
            wordList={CHALLENGING_ADJECTIVES}
            onWordChange={(word: string) => (challengingWord = word)}
          />
          International Baccalaureate (IB) Diploma Program.
        </HistoryItem>
        <ArrowSection />
        <ArrowTail />
      </HistorySection>
    </section>

    <section class="mx-auto max-w-[800px] px-8 py-16">
      <h2 class="mb-12 text-center text-4xl font-black">
        <MadLib
          word={projectsTitle}
          wordList={PROJECTS_TITLES}
          onWordChange={(word: string) => (projectsTitle = word)}
          class="p-4"
        />
      </h2>
      <div class="grid gap-8 md:grid-cols-2">
        {#each projects as project (project.slug)}
          <ProjectCard {project} />
        {/each}
      </div>
    </section>

    <section class="mx-auto max-w-[800px] px-8 py-16">
      <h2 class="mb-12 text-center text-4xl font-black">
        <MadLib
          word={blogTitle ?? ''}
          wordList={BLOG_TITLES}
          onWordChange={(word: string) => (blogTitle = word)}
          class="p-4"
        />
      </h2>
      <div class="grid gap-8 md:grid-cols-3">
        {#each blogPosts
          .filter((post) => post.tags.includes('tech'))
          .slice(0, 3) as post (post.slug)}
          <a href="/blog/{post.slug}" class="block no-underline">
            <article
              class="flex h-64 flex-col rounded-2xl border-2 border-slate-400 bg-slate-200/50 p-6 shadow-lg backdrop-blur-sm transition-colors hover:border-slate-500 md:h-[500px] dark:border-white/15 dark:bg-slate-900 dark:hover:border-white/30"
            >
              <h3
                class="mb-3 text-xl font-bold"
                style="view-transition-name: post-title-{post.slug}"
              >
                {post.title}
              </h3>
              <div class="relative flex-1 overflow-hidden">
                <p class="text-slate-600 dark:text-slate-300">{post.preview}</p>
                <div
                  class="pointer-events-none absolute bottom-0 left-0 h-32 w-full bg-gradient-to-t from-slate-200 to-transparent dark:from-slate-900"
                ></div>
              </div>
              <div class="mt-4 flex flex-wrap gap-2">
                {#each post.tags as tag (tag)}
                  <div style="view-transition-name: post-tag-{post.slug}-{tag}">
                    <TextBubble>{tag}</TextBubble>
                  </div>
                {/each}
              </div>
            </article>
          </a>
        {/each}
      </div>
      <div class="mt-8 text-center">
        <button
          onclick={() => {
            playPopSound();
            window.location.href = '/blog';
          }}
          class="inline-block transform rounded-lg bg-slate-300 px-6 py-3 text-lg text-slate-800 transition-all duration-150 hover:scale-105 hover:bg-slate-400 active:scale-100 active:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600 dark:active:bg-slate-700"
        >
          See all blog posts
        </button>
      </div>
    </section>

    <section class="mx-auto max-w-[800px] px-8 py-16">
      <div class="flex justify-center gap-8">
        <a
          href="https://github.com/taylor-gl"
          target="_blank"
          rel="noopener noreferrer"
          class="text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          aria-label="GitHub Profile"
        >
          <iconify-icon icon="carbon:logo-github" class="text-3xl" aria-hidden="true"
          ></iconify-icon>
        </a>

        <a
          href="https://www.linkedin.com/in/taylor-gl/"
          target="_blank"
          rel="noopener noreferrer"
          class="text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          aria-label="LinkedIn Profile"
        >
          <iconify-icon icon="carbon:logo-linkedin" class="text-3xl" aria-hidden="true"
          ></iconify-icon>
        </a>

        <button
          onclick={copyEmailToClipboardSocial}
          class="text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          aria-label={socialCopyLabel}
        >
          <div class="grid">
            {#if justCopiedSocial}
              <div
                class="col-start-1 col-end-2 row-start-1 row-end-2"
                out:blur={prefersReducedMotion ? { duration: 0 } : { duration: 500 }}
              >
                <iconify-icon icon="carbon:checkmark" class="text-3xl" aria-hidden="true"
                ></iconify-icon>
              </div>
            {:else}
              <div
                class="col-start-1 col-end-2 row-start-1 row-end-2"
                in:blur={prefersReducedMotion ? { duration: 0 } : { delay: 500, duration: 1000 }}
              >
                <iconify-icon icon="carbon:email" class="text-3xl" aria-hidden="true"
                ></iconify-icon>
              </div>
            {/if}
          </div>
        </button>
      </div>
    </section>
  </div>
</main>
