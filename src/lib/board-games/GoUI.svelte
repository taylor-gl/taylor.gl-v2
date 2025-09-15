<script>
  import { createEventDispatcher } from 'svelte';
  import * as GO from '$lib/board-games/Go.js';

  const dispatch = createEventDispatcher();

  let { game, humanCanMove = true } = $props();

  const R = GO;

  const isGameOver = $derived(R.gameIsOver(game));
  const gameOverText = $derived(R.gameOverText(game));

  const legalMoves = $derived(R.getAllValidMoves(game));
  const legalPlaceSet = $derived(
    new Set(legalMoves.filter((m) => m.type === 'place').map((m) => `${m.row},${m.col}`))
  );

  let hover = $state({ row: null, col: null });

  function handleIntersectionClick(row, col) {
    if (!humanCanMove) return;
    if (R.gameIsOver(game)) return;
    if (game.board[row][col] !== null) return;
    const key = `${row},${col}`;
    if (!legalPlaceSet.has(key)) return;
    dispatch('move', { type: 'place', row, col });
  }

  function handlePass() {
    if (!humanCanMove) return;
    if (R.gameIsOver(game)) return;
    const passMove = legalMoves.find((m) => m.type === 'pass') || { type: 'pass' };
    dispatch('move', passMove);
  }
</script>

<div class="go-wrapper">
  <div class="go-board" role="group" aria-label="Go board (9 by 9)">
    <div class="grid">
      {#each game.board as row, r (r)}
        {#each row as cell, c (c)}
          {@const isLegal = legalPlaceSet.has(`${r},${c}`)}
          <div
            class="cell"
            role="button"
            tabindex="0"
            aria-label={`Intersection ${String.fromCharCode(97 + c)}${9 - r}`}
            onmouseenter={() => (hover = { row: r, col: c })}
            onmouseleave={() => (hover = { row: null, col: null })}
            onfocus={() => (hover = { row: r, col: c })}
            onblur={() => (hover = { row: null, col: null })}
            onmousedown={(e) => e.preventDefault()}
            onclick={() => handleIntersectionClick(r, c)}
            onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && handleIntersectionClick(r, c)}
          >
            {#if cell}
              <div class={'stone ' + (cell === 'black' ? 'black' : 'white')}></div>
            {:else if humanCanMove && isLegal && hover.row === r && hover.col === c}
              <div class={'ghost ' + (game.currentPlayer === 'black' ? 'black' : 'white')}></div>
            {/if}

            {#if r === 8}
              <div class="file-label">{String.fromCharCode(97 + c)}</div>
            {/if}
            {#if c === 0}
              <div class="rank-label">{9 - r}</div>
            {/if}
          </div>
        {/each}
      {/each}
    </div>

    {#if isGameOver}
      <div class="board-overlay">
        <div class="overlay-text">{gameOverText}</div>
      </div>
    {/if}
  </div>

  <div class="controls">
    <button class="pass-btn" onclick={handlePass} disabled={!humanCanMove || isGameOver}
      >Pass</button
    >
  </div>
</div>

<style>
  .go-wrapper {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }

  .go-board {
    --cell: calc(560px / 9);
    position: relative;
    display: inline-block;
    background-color: #e3c07a;
    border: 3px solid #111111;
    border-radius: 8px;
    box-shadow: inset 0 0 0 2px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    width: calc(var(--cell) * 9);
    height: calc(var(--cell) * 9);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(9, var(--cell));
    grid-template-rows: repeat(9, var(--cell));
    position: relative;
    width: 100%;
    height: 100%;
  }

  .cell {
    position: relative;
    width: var(--cell);
    height: var(--cell);
    cursor: pointer;
    user-select: none;
  }

  .cell::before,
  .cell::after {
    content: '';
    position: absolute;
    background-color: #111111;
    opacity: 0.9;
    pointer-events: none;
    z-index: 1;
  }
  .cell::before {
    width: 2px;
    height: 100%;
    left: 50%;
    transform: translateX(-50%);
    top: 0;
  }
  .cell::after {
    height: 2px;
    width: 100%;
    top: 50%;
    transform: translateY(-50%);
    left: 0;
    z-index: 1;
  }

  .stone,
  .ghost {
    position: absolute;
    width: calc(var(--cell) * 0.85);
    height: calc(var(--cell) * 0.85);
    border-radius: 50%;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
  }

  .stone.black {
    background: radial-gradient(circle at 35% 35%, #444 0%, #000 60%, #000 100%);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
  }
  .stone.white {
    background: radial-gradient(circle at 35% 35%, #fff 0%, #e5e7eb 60%, #d1d5db 100%);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .ghost.black {
    background-color: rgba(0, 0, 0, 0.25);
  }
  .ghost.white {
    background-color: rgba(255, 255, 255, 0.6);
    box-shadow: inset 0 0 0 2px rgba(0, 0, 0, 0.2);
  }

  .file-label {
    position: absolute;
    bottom: 2px;
    right: 20px;
    font-size: 10px;
    font-weight: bold;
    color: rgba(17, 17, 17, 0.7);
    pointer-events: none;
  }
  .rank-label {
    position: absolute;
    top: 15px;
    left: 6px;
    font-size: 10px;
    font-weight: bold;
    color: rgba(17, 17, 17, 0.7);
    pointer-events: none;
  }

  .board-overlay {
    z-index: 3;
    position: absolute;
    inset: 0;
    background-color: rgba(17, 17, 17, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: all;
  }
  .overlay-text {
    color: #ffffff;
    font-size: 2rem;
    font-weight: bold;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  }

  .controls {
    display: flex;
    gap: 0.5rem;
    width: 100%;
  }
  .pass-btn {
    flex-grow: 1;
    padding: 0.5rem 0.75rem;
    border: 1px solid #111111;
    border-radius: 4px;
    background-color: transparent;
    cursor: pointer;
  }
  .pass-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: #f3f4f6;
  }
</style>
