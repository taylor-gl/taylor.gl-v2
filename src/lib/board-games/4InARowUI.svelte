<script>
  import { createEventDispatcher } from 'svelte';
  import 'iconify-icon';
  import { getGameName } from '$lib/board-games/Game.js';

  const dispatch = createEventDispatcher();

  let { game, humanCanMove = true } = $props();
  const ROWS = 6;
  const COLS = 7;

  const isHK = $derived(game.gameName === 'hugs-and-kisses');
  const R = $derived(getGameName(game));

  let hoverCol = $state(null);
  let prevBoard = null;
  let lastDrop = $state(null);
  let dropDoneKey = $state(null);

  function isColumnPlayable(col) {
    if (col < 0 || col >= COLS) return false;
    if (R.gameIsOver(game)) return false;
    return game.board[0][col] === null;
  }

  function handleColumnClick(col) {
    if (!humanCanMove) return;
    if (!isColumnPlayable(col)) return;
    dispatch('move', col);
  }

  $effect(() => {
    const board = game.board;
    if (!prevBoard) {
      prevBoard = board.map((row) => [...row]);
      lastDrop = null;
      return;
    }
    let added = null;
    let addedCount = 0;
    let removedCount = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const before = prevBoard[r][c];
        const after = board[r][c];
        if (before === null && after !== null) {
          added = { row: r, col: c, color: after };
          addedCount++;
        } else if (before !== null && after === null) {
          removedCount++;
        }
      }
    }
    if (addedCount === 1 && removedCount === 0 && added) {
      const key = `${game.history.length}:${added.row}:${added.col}`;
      if (isHK) {
        const mover = game.history[game.history.length - 1]?.currentPlayer;
        const initialColor = mover === 'red' ? 'red' : 'yellow';
        const initialSymbol = mover === 'red' ? 'O' : 'X';
        lastDrop = { ...added, key, initialColor, initialSymbol };
      } else {
        lastDrop = { ...added, key };
      }
      dropDoneKey = null;
    } else {
      lastDrop = null;
    }
    prevBoard = board.map((row) => [...row]);
  });
</script>

<div class="wrapper">
  <div class="board" role="group" onmouseleave={() => (hoverCol = null)}>
    <div class="grid">
      {#each game.board as row, r (r)}
        {#each row as cell, c (c)}
          <div
            class="cell"
            role="button"
            tabindex={r === 0 ? 0 : -1}
            onmouseenter={() => (hoverCol = c)}
            onfocus={() => (r === 0 ? (hoverCol = c) : null)}
            onblur={() => (hoverCol = null)}
            onmousedown={(event) => event.preventDefault()}
            onclick={() => handleColumnClick(c)}
            onkeydown={(event) => {
              if (r === 0 && (event.key === 'Enter' || event.key === ' ')) {
                if (event.key === ' ') event.preventDefault();
                handleColumnClick(c);
              }
            }}
          >
            {#if cell}
              {#if isHK}
                {@const isLatest = lastDrop && lastDrop.row === r && lastDrop.col === c}
                {@const showInitial = isLatest && dropDoneKey !== (lastDrop && lastDrop.key)}
                <div
                  class={'disc ' +
                    (showInitial ? lastDrop.initialColor : cell.color) +
                    (showInitial || !cell.active ? ' inactive' : '')}
                  class:drop-anim={isLatest}
                  style={isLatest ? `--row:${r}` : ''}
                  onanimationend={() => (dropDoneKey = lastDrop && lastDrop.key)}
                >
                  <iconify-icon
                    class="hk-icon"
                    icon={(showInitial ? lastDrop.initialSymbol : cell.symbol) === 'O'
                      ? 'mdi:circle-outline'
                      : (showInitial ? lastDrop.initialSymbol : cell.symbol) === 'X'
                        ? 'mdi:times'
                        : 'mdi:infinity'}
                    aria-hidden="true"
                  ></iconify-icon>
                </div>
              {:else}
                {@const isLatest = lastDrop && lastDrop.row === r && lastDrop.col === c}
                <div
                  class={'disc ' + cell}
                  class:drop-anim={isLatest}
                  style={isLatest ? `--row:${r}` : ''}
                ></div>
              {/if}
            {/if}

            {#if r === 0 && hoverCol === c && isColumnPlayable(c)}
              <div class="hover-disc"></div>
            {/if}
          </div>
        {/each}
      {/each}
    </div>

    <svg class="frame" viewBox="0 0 7 6" aria-hidden="true">
      <defs>
        <mask id="holesMask" maskUnits="userSpaceOnUse" x="0" y="0" width="7" height="6">
          <rect x="0" y="0" width="7" height="6" fill="white" />
          {#each Array(6) as _row, r (r)}
            {#each Array(7) as _col, c (c)}
              <circle cx={c + 0.5} cy={r + 0.5} r={0.38} fill="black" />
            {/each}
          {/each}
        </mask>
      </defs>
      <rect x="0" y="0" width="7" height="6" fill="#2563eb" mask="url(#holesMask)" />
    </svg>

    {#if R.gameIsOver(game)}
      <div class="board-overlay">
        <div class="overlay-text">{R.gameOverText(game)}</div>
      </div>
    {/if}
  </div>
</div>

<style>
  .wrapper {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    background-color: #ffffff;
    --cell-size: 80px;
  }
  .board {
    position: relative;
    display: block;
    border: 3px solid #111111;
    border-radius: 8px;
    overflow: hidden;
    width: calc(var(--cell-size) * 7);
    height: calc(var(--cell-size) * 6);
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(7, var(--cell-size));
    grid-template-rows: repeat(6, var(--cell-size));
    position: relative;
    width: 100%;
    height: 100%;
    z-index: 1;
  }
  .cell {
    position: relative;
    cursor: pointer;
    user-select: none;
    width: 100%;
    height: 100%;
  }

  .disc,
  .hover-disc {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80%;
    height: 80%;
    border-radius: 50%;
    pointer-events: none;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .disc.red {
    background-color: #ef4444;
  }
  .disc.yellow {
    background-color: #facc15;
  }
  .disc.gray {
    background-color: #9ca3af;
  }
  .disc.red.inactive {
    background-color: #fecaca;
  }
  .disc.yellow.inactive {
    background-color: #fde68a;
  }
  .disc.gray.inactive {
    background-color: #e5e7eb;
  }

  .disc {
    box-shadow:
      inset 0 2px 3px rgba(255, 255, 255, 0.22),
      inset 0 -2px 4px rgba(0, 0, 0, 0.22),
      inset 0 0 0 2px rgba(0, 0, 0, 0.1);
    isolation: isolate;
  }
  .disc::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: linear-gradient(to bottom, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0) 60%);
    pointer-events: none;
  }
  .disc::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background:
      radial-gradient(closest-side, rgba(0, 0, 0, 0) calc(100% - 3px), rgba(0, 0, 0, 0.14) 100%),
      linear-gradient(to top, rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0) 65%);
    pointer-events: none;
  }

  .hk-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    font-size: 2.2rem;
    color: #111111;
    pointer-events: none;
  }

  .hover-disc {
    background-color: rgba(128, 128, 128, 0.5);
  }

  .disc.drop-anim {
    animation: drop calc(150ms + var(--row) * 60ms) cubic-bezier(0.1, 0, 1, 1) both;
  }
  @keyframes drop {
    from {
      transform: translate(-50%, calc(-50% - var(--row) * var(--cell-size)));
    }
    to {
      transform: translate(-50%, -50%);
    }
  }

  .frame {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 2;
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
</style>
