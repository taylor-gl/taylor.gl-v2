<script>
  import { createEventDispatcher } from 'svelte';
  import FourInARowUI from '$lib/board-games/4InARowUI.svelte';
  import ChessUI from '$lib/board-games/ChessUI.svelte';
  import { getGameName } from '$lib/board-games/Game.js';
  import GoUI from '$lib/board-games/GoUI.svelte';
  import { getLlmMove, modelSupportsReasoning } from '$lib/board-games/LLMPlayer.js';
  import { randomMove } from '$lib/board-games/RandomPlayer.js';
  import ShoveUI from '$lib/board-games/ShoveUI.svelte';

  const dispatch = createEventDispatcher();

  let { game, openRouterApiKey } = $props();
  let shoveRef = $state(null);

  let playerOneType = $state('Human');
  let playerTwoType = $state('Human');
  let aiTimeoutId = $state(null);
  let selectedGameName = $derived(game.gameName);
  let currentPlayer = $derived.by(() => {
    if (game.gameName === 'go-9x9' || game.gameName === 'shove') {
      return game.currentPlayer === 'black' ? 'playerOne' : 'playerTwo';
    } else if (game.gameName === 'regular-chess' || game.gameName === 'fantastical-chess') {
      return game.currentPlayer === 'white' ? 'playerOne' : 'playerTwo';
    } else {
      return game.currentPlayer === 'red' ? 'playerOne' : 'playerTwo';
    }
  });

  let playerOneModel = $state('');
  let playerTwoModel = $state('');
  let playerOneEffort = $state('');
  let playerTwoEffort = $state('');
  let apiKeyFocused = $state(false);

  let statusMessage = $state('');
  let aiRequestCounter = 0;
  let waitingOnAi = $state(false);

  const R = $derived(getGameName(game));
  const isGameOver = $derived(R.gameIsOver(game));

  // TODO logging game state for now, so if something goes wrong I can check console
  $effect(() => {
    const R = getGameName(game);
    console.log(R.gameStateToString(game));
  });

  const humanCanMove = $derived.by(() => {
    if (isGameOver) return false;
    return currentPlayer === 'playerOne' ? playerOneType === 'Human' : playerTwoType === 'Human';
  });
  const aICanMove = $derived.by(() => {
    if (isGameOver) return false;
    return currentPlayer === 'playerOne' ? playerOneType !== 'Human' : playerTwoType !== 'Human';
  });

  $effect(() => {
    void playerOneType;
    if (playerOneType !== 'AI Model' && playerOneModel) {
      playerOneModel = '';
    }
  });
  $effect(() => {
    void playerTwoType;
    if (playerTwoType !== 'AI Model' && playerTwoModel) {
      playerTwoModel = '';
    }
  });

  const waitingOnPlayerOneAI = $derived(
    currentPlayer === 'playerOne' && playerOneType !== 'Human' && waitingOnAi === true
  );
  const waitingOnPlayerTwoAI = $derived(
    currentPlayer === 'playerTwo' && playerTwoType !== 'Human' && waitingOnAi === true
  );

  function cancelAIMoveInProgress() {
    if (aiTimeoutId) {
      clearTimeout(aiTimeoutId);
      aiTimeoutId = null;
    }
    aiRequestCounter++;
    statusMessage = '';
    waitingOnAi = false;
  }

  function forwardMove(e) {
    dispatch('move', e.detail);
  }

  function restart() {
    dispatch('restart');
    cancelAIMoveInProgress();
    playerOneType = 'Human';
    playerTwoType = 'Human';
  }

  function undo() {
    if (
      game.gameName === 'shove' &&
      shoveRef &&
      typeof shoveRef.cancelPendingIfAny === 'function'
    ) {
      const consumed = shoveRef.cancelPendingIfAny();
      if (consumed) {
        cancelAIMoveInProgress();
        return;
      }
    }
    dispatch('undo');
    cancelAIMoveInProgress();
  }

  function changeGame(name) {
    cancelAIMoveInProgress();
    dispatch('changeGame', { gameName: name });
    statusMessage = '';
  }

  $effect(() => {
    if (aICanMove && !waitingOnAi) {
      aiRequestCounter++;
      const currentAiRequestCounter = aiRequestCounter;

      const currentType = currentPlayer === 'playerOne' ? playerOneType : playerTwoType;

      if (currentType === 'Random') {
        statusMessage = 'The Random player is thinking...';
        waitingOnAi = true;
        aiTimeoutId = setTimeout(() => {
          const moves = R.getAllValidMoves(game);
          if (moves.length > 0) {
            const choice = randomMove(moves);
            if (currentAiRequestCounter === aiRequestCounter) {
              dispatch('move', choice);
            }
          }
          aiTimeoutId = null;
          statusMessage = '';
          waitingOnAi = false;
        }, 1000);
      } else if (currentType === 'AI Model') {
        const model = currentPlayer === 'playerOne' ? playerOneModel : playerTwoModel;
        if (!openRouterApiKey || !model) {
          statusMessage = '';
          waitingOnAi = false;
          return;
        }
        const effortSelected = currentPlayer === 'playerOne' ? playerOneEffort : playerTwoEffort;
        if (modelSupportsReasoning(model) && !effortSelected) {
          statusMessage = 'Please choose a reasoning effort for the selected model.';
          waitingOnAi = false;
          return;
        }
        statusMessage = 'The AI is thinking...';
        waitingOnAi = true;
        (async () => {
          let attempt = 0;
          let chosenMove = null;
          let lastError = '';
          while (attempt < 5 && !chosenMove) {
            attempt++;
            statusMessage = `The AI is thinking... ${attempt > 1 ? ` (attempt ${attempt})` : ''}`;
            const result = await getLlmMove(game, openRouterApiKey, model, effortSelected);
            if (result.move !== null) {
              chosenMove = result.move;
              break;
            } else if (result.error) {
              lastError = result.error;
              statusMessage = result.error;
            } else {
              lastError = 'Unknown error getting move from the AI model.';
              statusMessage = lastError;
            }
          }
          if (chosenMove !== null && currentAiRequestCounter === aiRequestCounter) {
            dispatch('move', chosenMove);
            statusMessage = '';
            waitingOnAi = false;
          } else {
            if (game.gameName === '4-in-a-row' || game.gameName === 'hugs-and-kisses') {
              if (currentPlayer === 'playerOne') {
                playerOneType = 'Human';
              } else {
                playerTwoType = 'Human';
              }
            }
            waitingOnAi = false;
          }
        })();
      }
    }
  });
</script>

<div>
  <div class="chess-game">
    <div class="scroll-x">
      <div class="card">
        <div class="player-selectors">
          <div class="selector">
            <div>
              <label for="game-select">Game</label>
              <select
                id="game-select"
                bind:value={selectedGameName}
                class="player-select"
                onchange={(e) => changeGame(e.target.value)}
              >
                <option value="fantastical-chess">Fantastical Chess</option>
                <option value="regular-chess">Chess</option>
                <option value="4-in-a-row">4 in a Row</option>
                <option value="hugs-and-kisses">Hugs and Kisses</option>
                <option value="go-9x9">Go (9x9)</option>
                <option value="shove">Shove (7x7)</option>
              </select>
            </div>
          </div>
          {#if playerOneType === 'AI Model' || playerTwoType === 'AI Model'}
            <div class="selector">
              <div>
                <label for="api-key">OpenRouter API Key</label>
                <input
                  id="api-key"
                  class="player-select"
                  type={apiKeyFocused ? 'text' : 'password'}
                  value={openRouterApiKey}
                  oninput={(e) => dispatch('saveApiKey', e.target.value)}
                  placeholder="sk-or-v1-..."
                  onfocus={() => (apiKeyFocused = true)}
                  onblur={() => (apiKeyFocused = false)}
                  autocomplete="off"
                  spellcheck="false"
                />
              </div>
            </div>
          {/if}
        </div>
        <div class="player-selectors">
          <div class="selector">
            <div>
              <label for="player-one-type"
                >{game.gameName === 'go-9x9' || game.gameName === 'shove'
                  ? 'Black'
                  : game.gameName === 'regular-chess' || game.gameName === 'fantastical-chess'
                    ? 'White'
                    : 'Red'}</label
              >
              <select
                id="player-one-type"
                bind:value={playerOneType}
                class="player-select"
                disabled={waitingOnPlayerOneAI}
              >
                <option>Human</option>
                <option>Random</option>
                <option>AI Model</option>
              </select>
            </div>
            <div>
              {#if playerOneType === 'AI Model'}
                <label for="player-one-model">Model</label>
                <select
                  id="player-one-model"
                  bind:value={playerOneModel}
                  class="player-select"
                  disabled={waitingOnPlayerOneAI}
                >
                  <option value="" disabled>Choose a model...</option>
                  <option>GPT-3.5-turbo (v0613; June 2023)</option>
                  <option>GPT-4o (2024-05-13; May 2024)</option>
                  <option>GPT-4.1 (April 2025)</option>
                  <option>GPT-5 (August 2025)</option>
                </select>
              {/if}
            </div>
            {#if playerOneType === 'AI Model' && modelSupportsReasoning(playerOneModel)}
              <div>
                <label for="player-one-effort">Reasoning Effort</label>
                <select
                  id="player-one-effort"
                  bind:value={playerOneEffort}
                  class="player-select"
                  disabled={waitingOnPlayerOneAI}
                >
                  <option value="" disabled>Choose effort...</option>
                  <option value="high">high</option>
                  <option value="medium">medium</option>
                  <option value="low">low</option>
                  <option value="minimal">minimal</option>
                </select>
              </div>
            {/if}
          </div>
          <div class="selector">
            <div>
              <label for="player-two-type"
                >{game.gameName === 'go-9x9' || game.gameName === 'shove'
                  ? 'White'
                  : game.gameName === 'regular-chess' || game.gameName === 'fantastical-chess'
                    ? 'Black'
                    : 'Yellow'}</label
              >
              <select
                id="player-two-type"
                bind:value={playerTwoType}
                class="player-select"
                disabled={waitingOnPlayerTwoAI}
              >
                <option>Human</option>
                <option>Random</option>
                <option>AI Model</option>
              </select>
            </div>
            <div>
              {#if playerTwoType === 'AI Model'}
                <label for="player-two-model">Model</label>
                <select
                  id="player-two-model"
                  bind:value={playerTwoModel}
                  class="player-select"
                  disabled={waitingOnPlayerTwoAI}
                >
                  <option value="" disabled>Choose a model...</option>
                  <option>GPT-3.5-turbo (v0613; June 2023)</option>
                  <option>GPT-4o (2024-05-13; May 2024)</option>
                  <option>GPT-4.1 (April 2025)</option>
                  <option>GPT-5 (August 2025)</option>
                </select>
              {/if}
            </div>
            {#if playerTwoType === 'AI Model' && modelSupportsReasoning(playerTwoModel)}
              <div>
                <label for="player-two-effort">Reasoning Effort</label>
                <select
                  id="player-two-effort"
                  bind:value={playerTwoEffort}
                  class="player-select"
                  disabled={waitingOnPlayerTwoAI}
                >
                  <option value="" disabled>Choose effort...</option>
                  <option value="high">high</option>
                  <option value="medium">medium</option>
                  <option value="low">low</option>
                  <option value="minimal">minimal</option>
                </select>
              </div>
            {/if}
          </div>
        </div>

        {#if game.gameName === '4-in-a-row' || game.gameName === 'hugs-and-kisses'}
          <FourInARowUI {game} {humanCanMove} on:move={forwardMove} />
        {:else if game.gameName === 'go-9x9'}
          <GoUI {game} {humanCanMove} on:move={forwardMove} />
        {:else if game.gameName === 'shove'}
          <ShoveUI bind:this={shoveRef} {game} {humanCanMove} on:move={forwardMove} />
        {:else}
          <ChessUI {game} {humanCanMove} on:move={forwardMove} />
        {/if}
        <div class="message-area">{statusMessage}</div>

        <div class="controls">
          <button onclick={restart} class="restart-btn"> Restart Game </button>
          <button onclick={undo} class="undo-btn"> Undo </button>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .chess-game {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem;
  }

  .scroll-x {
    width: 100%;
    overflow-x: auto;
    overflow-y: visible;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-x pan-y;
  }

  .card {
    padding: 1rem;
    background-color: white;
    border: 1px solid #111111;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    width: max-content;
    max-width: none;
    margin-inline: auto;
  }

  .selector {
    gap: 0.75rem;
    display: flex;
    flex-direction: column;
  }

  .player-selectors {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  @media (max-width: 640px) {
    .player-selectors {
      grid-template-columns: 1fr;
    }
  }

  .player-select {
    display: block;
    width: 100%;
    max-width: 100%;
    padding: 0.5rem 0.75rem;
    background-color: transparent;
    border: 1px solid #111111;
    border-radius: 4px;
    cursor: pointer;
    box-sizing: border-box;
    height: 40px;
    min-width: 0;
    font: inherit;
  }

  .player-select:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: #f3f4f6;
  }

  .selector label {
    display: block;
    margin-bottom: 0.25rem;
  }

  .message-area {
    min-height: 1.25rem;
    margin-top: 1rem;
  }

  .controls {
    display: flex;
    flex-direction: row;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .controls button {
    flex-grow: 1;
    padding: 0.75rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
    border: 1px solid #111111;
  }

  .restart-btn {
    background-color: transparent;
    color: #111111;
  }

  .restart-btn:hover {
    background-color: #084f1e;
    color: white;
  }

  .undo-btn {
    background-color: transparent;
    color: #111111;
  }

  .undo-btn:hover {
    background-color: #5a6268;
    color: white;
  }
</style>
