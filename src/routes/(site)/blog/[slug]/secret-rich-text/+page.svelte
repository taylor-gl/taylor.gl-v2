<script lang="ts">
  import { onMount } from 'svelte';
  import GlowButton from '../../../GlowButton.svelte';

  const { data } = $props();

  let processedHtml = '';
  let footnotes = $state<Array<{ number: number; html: string }>>([]);

  onMount(() => {
    const doc = new DOMParser().parseFromString(data.post.content, 'text/html');

    const tempFootnotes: Array<{ number: number; html: string }> = [];
    const footnoteSection = doc.querySelector('.footnotes');
    if (footnoteSection) {
      footnoteSection.querySelectorAll('li').forEach((li, index) => {
        const content = li.cloneNode(true) as HTMLElement;
        content.querySelectorAll('a[data-footnote-backref]').forEach((ref) => ref.remove());
        tempFootnotes.push({ number: index + 1, html: content.innerHTML.trim() });
      });
      footnoteSection.remove();
    }

    doc.querySelectorAll('sup a[href^="#footnote-"]').forEach((link) => {
      link.parentElement?.replaceWith(
        doc.createTextNode(
          `INSERT FOOTNOTE ${link.textContent} HERE. FOOTNOTE FOOTNOTE FOOTNOTE FOOTNOTE FOOTNOTE FOOTNOTE FOOTNOTE FOOTNOTE FOOTNOTE FOOTNOTE FOOTNOTE FOOTNOTE FOOTNOTE FOOTNOTE FOOTNOTE FOOTNOTE FOOTNOTE FOOTNOTE FOOTNOTE FOOTNOTE FOOTNOTE FOOTNOTE FOOTNOTE FOOTNOTE `
        )
      );
    });

    footnotes = tempFootnotes;

    doc.querySelectorAll('figure').forEach((fig) => {
      const media = fig.querySelector('img, video');
      const caption = fig.querySelector('figcaption')?.textContent;
      if (media) fig.before(media.cloneNode(true));
      if (caption) {
        const p = doc.createElement('p');
        p.style.cssText = 'text-align: center; font-style: italic;';
        p.textContent = caption;
        fig.before(p);
      }
      fig.remove();
    });

    processedHtml = doc.body.innerHTML;
  });

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
  }

  function copyRichText(html: string) {
    const el = document.createElement('div');
    el.innerHTML = html;
    document.body.appendChild(el);
    const range = document.createRange();
    range.selectNode(el);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);
    document.execCommand('copy');
    window.getSelection()?.removeAllRanges();
    el.remove();
  }
</script>

<svelte:head>
  <title>Copy "{data.post.title}"</title>
</svelte:head>

<main class="relative min-h-screen fill-current">
  <div class="fixed inset-0 bg-slate-100 bg-[url('/graph-paper-light.svg')] dark:hidden"></div>
  <div class="fixed inset-0 hidden bg-slate-900 bg-[url('/graph-paper-dark.svg')] dark:block"></div>

  <div class="relative z-10 text-slate-800 dark:text-slate-300">
    <div class="container">
      <a href="/blog/{data.post.slug}" class="back-link">← back to post</a>
      <h1>Secret Rich Text Copyer for Substack</h1>
      <p><strong>Post:</strong> {data.post.title}</p>
      <div class="buttons">
        <GlowButton onClick={() => copyText(data.post.title)}>Copy Title</GlowButton>
        <GlowButton onClick={() => copyRichText(processedHtml)}>Copy Rich Text Content</GlowButton>
      </div>

      {#if footnotes.length}
        <div class="footnote-buttons">
          {#each footnotes as fn (fn.number)}
            <GlowButton onClick={() => copyRichText(fn.html)}>Copy Footnote #{fn.number}</GlowButton
            >
          {/each}
        </div>
      {/if}
    </div>
  </div>
</main>

<style>
  .container {
    padding: 2rem;
    margin: auto;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    min-height: 100vh;
  }

  .buttons {
    display: flex;
    gap: 1rem;
    margin-top: 1.5rem;
  }

  .footnote-buttons {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin-top: 1rem;
  }

  .back-link {
    position: absolute;
    top: 2rem;
    left: 2rem;
    opacity: 0.5;
    transition: opacity 0.2s;
  }

  .back-link:hover {
    opacity: 1;
  }
</style>
