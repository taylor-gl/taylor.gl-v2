<script>
  import { marked } from 'marked';
  import { browser } from '$app/environment';
  import { rules as connect4Rules } from '$lib/board-games/4InARow.js';
  import { rules as chessRules } from '$lib/board-games/Chess.js';
  import { rules as fantasticalChessRules } from '$lib/board-games/FantasticalChess.js';
  import { getGameName } from '$lib/board-games/Game.js';
  import GamePlayer from '$lib/board-games/GamePlayer.svelte';
  import { rules as goRules } from '$lib/board-games/Go.js';
  import { rules as hugsAndKissesRules } from '$lib/board-games/HugsAndKisses.js';
  import { rules as shoveRules } from '$lib/board-games/Shove.js';

  marked.setOptions({ gfm: true, smartypants: true });

  const RULE_SECTIONS = [
    { id: 'chess', title: 'Chess', rules: chessRules },
    { id: 'fantastical-chess', title: 'Fantastical Chess', rules: fantasticalChessRules },
    { id: 'go-9x9', title: 'Go (9x9)', rules: goRules },
    { id: 'shove', title: 'Shove', rules: shoveRules },
    { id: 'hugs-and-kisses', title: 'Hugs and Kisses', rules: hugsAndKissesRules },
    { id: '4-in-a-row', title: '4 in a Row', rules: connect4Rules },
  ];

  const RULE_SECTIONS_HTML = RULE_SECTIONS.map((s) => ({
    ...s,
    html: marked.parse(s.rules()),
  }));

  let { data } = $props();

  const GAME_STORAGE_KEY = 'board-games-game';
  const API_KEY_STORAGE_KEY = 'board-games-api-key';

  let game = $state(data.initialGame);
  let openRouterApiKey = $state(data.openRouterApiKey);

  function saveApiKey(apiKey) {
    if (browser) {
      localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
    }
  }

  function saveGame(game) {
    if (browser) {
      localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(game));
    }
  }

  function handleSaveApiKey(e) {
    const apiKey = e.detail;
    saveApiKey(apiKey);
    openRouterApiKey = apiKey;
  }

  function handleMove(e) {
    const move = e.detail;
    const R = getGameName(game);
    game = R.makeMove(game, move);
    saveGame(game);
  }

  function handleRestart() {
    const R = getGameName(game);
    game = R.createGame();
    saveGame(game);
  }

  function handleUndo() {
    const R = getGameName(game);
    game = R.undo(game);
    saveGame(game);
  }

  function handleChangeGame(event) {
    const { gameName } = event.detail;
    const R = getGameName({ gameName });
    game = R.createGame();
    saveGame(game);
  }
</script>

<h1>AI Board Game Player</h1>

<GamePlayer
  {game}
  {openRouterApiKey}
  on:saveApiKey={handleSaveApiKey}
  on:move={handleMove}
  on:restart={handleRestart}
  on:undo={handleUndo}
  on:changeGame={handleChangeGame}
/>

<h2>Game Rules</h2>
<p>(These are the exact rules the AI models have access to.)</p>
<nav aria-label="Table of contents">
  <ul>
    {#each RULE_SECTIONS_HTML as section (section.id)}
      <li><a href={'#' + section.id}>{section.title}</a></li>
    {/each}
  </ul>
</nav>

{#each RULE_SECTIONS_HTML as section (section.id)}
  <h2 id={section.id}>{section.title}</h2>
  <div>{@html section.html}</div>
{/each}

<hr />

<h2>Acknowledgments</h2>
<p>
  The wizard hat icon is from <a href="https://fontawesome.com/search?q=wizard%20hat&o=r"
    >Font Awesome</a
  >.
</p>
<p>Icons from various authors at <a href="https://github.com/game-icons/icons">game-icons</a>:</p>
<ul>
  <li>skoll (chess icons)</li>
  <li>faithtoken (ninja star)</li>
  <li>lorc (potion ball and shark jaws)</li>
  <li>heavenly-dog (catapult)</li>
  <li>delapouite (flatfish)</li>
</ul>
