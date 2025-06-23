<script lang="ts">
  import isMuted from '$lib/stores/isMuted';
  import theme from '$lib/stores/theme';
  import MenuButton from './MenuButton.svelte';

  function toggleTheme() {
    theme.update((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  }

  function toggleMute() {
    isMuted.update((current) => !current);
  }
</script>

<div class="absolute top-4 right-4 z-20 flex items-center gap-2">
  <MenuButton
    onIcon="carbon:sun"
    offIcon="carbon:moon"
    onSound="/pop.wav"
    offSound="/pop.wav"
    toggled={$theme === 'light'}
    ariaLabel="Toggle theme"
    onToggle={toggleTheme}
  />
  <MenuButton
    onIcon="carbon:volume-up"
    offIcon="carbon:volume-mute"
    onSound="/pop.wav"
    offSound={null}
    toggled={!$isMuted}
    ariaLabel={$isMuted ? 'Unmute sound effects' : 'Mute sound effects'}
    onToggle={toggleMute}
    isVolumeButton={true}
  />
</div>
