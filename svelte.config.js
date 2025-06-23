import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://svelte.dev/docs/kit/integrations
  // for more information about preprocessors
  //preprocess: sveltePreprocess(),

  kit: {
    // adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
    // If your environment is not supported, or you settled on a specific environment, switch out the adapter.
    // See https://svelte.dev/docs/kit/adapters for more information about adapters.
    adapter: adapter({
      fallback: 'app.html',
    }),
    prerender: {
      handleHttpError: ({ path, referrer, message }) => {
        // Ignore 404s for external links during prerendering
        if (message.includes('404')) {
          console.warn(`Ignoring 404 for ${path} (linked from ${referrer})`);
          return;
        }
        throw new Error(message);
      },
    },
  },
};

export default config;
