<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import * as SH from '$lib/board-games/Shove.js';

  let TRENCH_STRIP_THICKNESS = 0.05;
  let SHOW_OUTER_TRAPEZOIDS = false;
  const BOARD_COLOR = '#e3c07a';

  const dispatch = createEventDispatcher();

  let { game, humanCanMove = true } = $props();

  // We render on a 9x9 canvas; the playable 7x7 is centered at rows/cols 1..7
  const BOARD_CELLS = 9;
  const INNER_START = 1; // inclusive
  const INNER_END = 7; // inclusive
  const INNER_SIZE = 7;

  const isGameOver = $derived(SH.gameIsOver(game));
  const gameOverText = $derived(SH.gameOverText(game));

  const legalMoves = $derived(SH.getAllValidMoves(game));
  const legalPlaceSet = $derived(
    new Set(legalMoves.filter((m) => m.type === 'place').map((m) => `${m.row},${m.col}`))
  );

  let hover = $state({ row: null, col: null });

  let pending = $state(null); // { row, col, dirs: ['U','D','L','R'] }

  let lastAnim = $state({ key: null, moves: [] });
  let animEndCounter = $state(0);

  export function cancelPendingIfAny() {
    if (pending) {
      pending = null;
      return true;
    }
    return false;
  }

  function inBounds(r, c) {
    return r >= 0 && r < INNER_SIZE && c >= 0 && c < INNER_SIZE;
  }
  function isStone(cell) {
    return cell === 'black' || cell === 'white';
  }
  function deepClone(board) {
    return board.map((row) => [...row]);
  }
  function neighbors(r, c) {
    return [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ].map(([dr, dc]) => [r + dr, c + dc]);
  }
  function isBoulderStone(board, r, c) {
    const color = board[r][c];
    if (!isStone(color)) return false;
    const anchors = [
      [r - 1, c - 1],
      [r - 1, c],
      [r, c - 1],
      [r, c],
    ];
    for (const [ar, ac] of anchors) {
      if (!inBounds(ar, ac) || !inBounds(ar + 1, ac + 1)) continue;
      const s1 = board[ar][ac],
        s2 = board[ar][ac + 1],
        s3 = board[ar + 1][ac],
        s4 = board[ar + 1][ac + 1];
      if (s1 && s2 && s3 && s4 && s1 === s2 && s2 === s3 && s3 === s4) return true;
    }
    return false;
  }
  function getMovingGroup(board, r, c) {
    const color = board[r][c];
    if (!isStone(color)) return new Set();
    if (isBoulderStone(board, r, c)) return new Set();
    const key = (rr, cc) => rr + ',' + cc;
    const group = new Set([key(r, c)]);
    const stack = [[r, c]];
    while (stack.length) {
      const [cr, cc] = stack.pop();
      for (const [nr, nc] of neighbors(cr, cc)) {
        if (!inBounds(nr, nc)) continue;
        if (board[nr][nc] !== color) continue;
        if (isBoulderStone(board, nr, nc)) continue;
        const k = key(nr, nc);
        if (!group.has(k)) {
          group.add(k);
          stack.push([nr, nc]);
        }
      }
    }
    return group;
  }

  const DIRS = { U: [-1, 0], D: [1, 0], L: [0, -1], R: [0, 1] };

  function computeShiftMapping(beforeBoard, move, moverColor) {
    // Returns [{ from:{r,c}, to:{r,c}|null, color, type:'slide'|'fall', dir }]
    if (!move || move.type !== 'place' || !move.dir) return [];
    const [dr, dc] = DIRS[move.dir];

    const trial = deepClone(beforeBoard);
    trial[move.row][move.col] = moverColor;

    const group = getMovingGroup(trial, move.row, move.col);
    if (group.size === 0) return [];

    const out = deepClone(trial);

    const groupCells = [];
    for (const k of group) {
      const [r, c] = k.split(',').map((x) => parseInt(x, 10));
      groupCells.push([r, c]);
      out[r][c] = null;
    }

    const mapping = [];

    function processLine(index) {
      const cellsInLine = groupCells.filter(([r, c]) => (dr === 0 ? r === index : c === index));
      if (cellsInLine.length === 0) return true;

      const sorted = cellsInLine.sort((a, b) => {
        if (dr === 0) return dc > 0 ? a[1] - b[1] : b[1] - a[1];
        return dr > 0 ? a[0] - b[0] : b[0] - a[0];
      });

      const toPush = new Set();
      for (const [r, c] of sorted) {
        const nr = r + dr,
          nc = c + dc;
        if (!inBounds(nr, nc)) continue;
        let cr = nr,
          cc = nc;
        while (inBounds(cr, cc) && isStone(out[cr][cc])) {
          if (isBoulderStone(out, cr, cc)) return false;
          toPush.add(cr + ',' + cc);
          cr += dr;
          cc += dc;
        }
      }

      const pushed = Array.from(toPush)
        .map((k) => k.split(',').map((x) => parseInt(x, 10)))
        .sort((a, b) => {
          if (dr === 0) return dc > 0 ? b[1] - a[1] : a[1] - b[1];
          return dr > 0 ? b[0] - a[0] : a[0] - b[0];
        });

      for (const [r, c] of pushed) {
        const nr = r + dr,
          nc = c + dc;
        const color = out[r][c];
        if (inBounds(nr, nc)) {
          out[nr][nc] = color;
          mapping.push({
            from: { r, c },
            to: { r: nr, c: nc },
            color,
            type: 'slide',
            dir: move.dir,
          });
        } else {
          mapping.push({ from: { r, c }, to: null, color, type: 'fall', dir: move.dir });
        }
        out[r][c] = null;
      }

      for (const [r, c] of sorted) {
        const nr = r + dr,
          nc = c + dc;
        const color = trial[r][c];
        if (inBounds(nr, nc)) {
          out[nr][nc] = color;
          mapping.push({
            from: { r, c },
            to: { r: nr, c: nc },
            color,
            type: 'slide',
            dir: move.dir,
          });
        } else {
          mapping.push({ from: { r, c }, to: null, color, type: 'fall', dir: move.dir });
        }
      }

      return true;
    }

    if (dr === 0) {
      for (let r = 0; r < INNER_SIZE; r++) if (!processLine(r)) return [];
    } else {
      for (let c = 0; c < INNER_SIZE; c++) if (!processLine(c)) return [];
    }

    return mapping;
  }

  function handleCellClick(r9, c9) {
    if (!humanCanMove || isGameOver) return;
    if (r9 < INNER_START || r9 > INNER_END || c9 < INNER_START || c9 > INNER_END) return;

    const r = r9 - INNER_START,
      c = c9 - INNER_START;
    if (game.board[r][c] !== null) return;
    const key = `${r},${c}`;
    if (!legalPlaceSet.has(key)) return;

    const cellMoves = legalMoves.filter((m) => m.type === 'place' && m.row === r && m.col === c);
    if (cellMoves.length === 0) return;
    const noDir = cellMoves.find((m) => !m.dir);
    if (noDir) {
      dispatch('move', { type: 'place', row: r, col: c });
      pending = null;
      return;
    }
    const dirs = Array.from(new Set(cellMoves.map((m) => m.dir)));
    if (dirs.length > 0) {
      pending = { row: r, col: c, dirs };
    }
  }

  function chooseDir(d) {
    if (!pending) return;
    const { row, col, dirs } = pending;
    if (!dirs.includes(d)) return;
    console.log('[ShoveUI] chooseDir', { row, col, dir: d });
    dispatch('move', { type: 'place', row, col, dir: d });
    pending = null;
  }

  function handlePass() {
    if (!humanCanMove || isGameOver) return;
    const passMove = SH.getAllValidMoves(game).find((m) => m.type === 'pass') || { type: 'pass' };
    dispatch('move', passMove);
    pending = null;
  }

  let boardEl = null;

  onMount(() => {
    const keyHandler = (e) => {
      if (e.key === 'Escape') pending = null;
    };
    window.addEventListener('keydown', keyHandler);

    return () => {
      window.removeEventListener('keydown', keyHandler);
    };
  });

  $effect(() => {
    void game.history.length;
    pending = null;
  });
  $effect(() => {
    void game.gameName;
    pending = null;
  });

  onMount(() => {
    const cancelOutside = (e) => {
      if (!pending) return;
      const t = e.target;
      if (t && t.closest && t.closest('button.dir')) return;
      if (!boardEl) return;
      const rect = boardEl.getBoundingClientRect();
      const cell = rect.width / 9;
      const pr = pending.row + INNER_START;
      const pc = pending.col + INNER_START;
      const minX = rect.left + pc * cell;
      const maxX = rect.left + (pc + 1) * cell;
      const minY = rect.top + pr * cell;
      const maxY = rect.top + (pr + 1) * cell;
      const x = e.clientX,
        y = e.clientY;
      const inside = x >= minX && x <= maxX && y >= minY && y <= maxY;
      if (!inside) {
        pending = null;
      }
    };
    window.addEventListener('click', cancelOutside);
    return () => window.removeEventListener('click', cancelOutside);
  });

  $effect(() => {
    const hist = game.history;
    const latestState = hist[hist.length - 1];
    const before = latestState?.board;
    const latestMove = latestState?.move;

    if (!before || !latestMove) {
      lastAnim = { key: null, moves: [] };
      animEndCounter = 0;
      return;
    }

    if (latestMove.type === 'place' && latestMove.dir) {
      const mover = latestState.currentPlayer || 'black';
      const mapping = computeShiftMapping(before, latestMove, mover);
      lastAnim = {
        key: `${hist.length}:${latestMove.row}:${latestMove.col}:${latestMove.dir}`,
        moves: mapping,
      };
      animEndCounter = 0;
    } else {
      lastAnim = { key: null, moves: [] };
      animEndCounter = 0;
    }
  });
</script>

<div class="shove-wrapper" role="group" aria-label="Shove board container">
  <div class="shove-board" role="group" aria-label="Shove board" bind:this={boardEl}>
    <div class="grid9">
      {#each Array(BOARD_CELLS) as _, r9 (r9)}
        {#each Array(BOARD_CELLS) as __, c9 (c9)}
          {@const isInner =
            r9 >= INNER_START && r9 <= INNER_END && c9 >= INNER_START && c9 <= INNER_END}
          {@const r = r9 - INNER_START}
          {@const c = c9 - INNER_START}
          <div
            class={'cell9 ' + (isInner ? 'inner' : 'gutter')}
            role={isInner ? 'button' : undefined}
            aria-label={isInner
              ? `Intersection ${String.fromCharCode(97 + c)}${INNER_SIZE - r}`
              : undefined}
            onmouseenter={() => (hover = { row: r9, col: c9 })}
            onmouseleave={() => (hover = { row: null, col: null })}
            onfocus={() => (hover = { row: r9, col: c9 })}
            onblur={() => (hover = { row: null, col: null })}
            onmousedown={(e) => {
              const t = e.target;
              if (!(t && t.closest && t.closest('button.dir'))) {
                e.preventDefault();
              }
            }}
            onclick={() => handleCellClick(r9, c9)}
            onkeydown={(e) => {
              if (isInner && r9 === INNER_START && (e.key === 'Enter' || e.key === ' ')) {
                if (e.key === ' ') e.preventDefault();
                handleCellClick(r9, c9);
              }
            }}
          >
            {#if isInner}
              {#if game.board[r][c]}
                {@const cellColor = game.board[r][c]}
                {@const isToOfAnim =
                  lastAnim.key && lastAnim.moves.some((m) => m.to && m.to.r === r && m.to.c === c)}
                <div
                  class={'stone ' +
                    (cellColor === 'black' ? 'black' : 'white') +
                    (isToOfAnim ? ' hidden' : '')}
                ></div>
              {:else if humanCanMove && pending && pending.row === r && pending.col === c}
                <div
                  class={'stone ' +
                    (game.currentPlayer === 'black' ? 'black' : 'white') +
                    ' preplaced'}
                ></div>
              {:else if humanCanMove && legalPlaceSet.has(`${r},${c}`) && hover.row === r9 && hover.col === c9 && !pending}
                <div class={'ghost ' + (game.currentPlayer === 'black' ? 'black' : 'white')}></div>
              {/if}

              {#if r9 === INNER_END}
                <div class="file-label">{String.fromCharCode(97 + c)}</div>
              {/if}
              {#if c9 === INNER_START}
                <div class="rank-label">{INNER_SIZE - r}</div>
              {/if}

              {#if false}{/if}
            {/if}
          </div>
        {/each}
      {/each}
    </div>

    {#if humanCanMove && pending}
      {@const pr = pending.row + INNER_START}
      {@const pc = pending.col + INNER_START}
      <div class={'dir-layer ' + (game.currentPlayer === 'white' ? 'on-white' : 'on-black')}>
        {#if pending.dirs.includes('U')}
          <button
            type="button"
            class="dir dir-up"
            style={`--pr:${pr}; --pc:${pc};`}
            onclick={(e) => {
              e.stopPropagation();
              chooseDir('U');
            }}
            aria-label="Shift up"
          ></button>
        {/if}
        {#if pending.dirs.includes('D')}
          <button
            type="button"
            class="dir dir-down"
            style={`--pr:${pr}; --pc:${pc};`}
            onclick={(e) => {
              e.stopPropagation();
              chooseDir('D');
            }}
            aria-label="Shift down"
          ></button>
        {/if}
        {#if pending.dirs.includes('L')}
          <button
            type="button"
            class="dir dir-left"
            style={`--pr:${pr}; --pc:${pc};`}
            onclick={(e) => {
              e.stopPropagation();
              chooseDir('L');
            }}
            aria-label="Shift left"
          ></button>
        {/if}
        {#if pending.dirs.includes('R')}
          <button
            type="button"
            class="dir dir-right"
            style={`--pr:${pr}; --pc:${pc};`}
            onclick={(e) => {
              e.stopPropagation();
              chooseDir('R');
            }}
            aria-label="Shift right"
          ></button>
        {/if}
      </div>
    {/if}

    <svg
      class="trench"
      viewBox="0 0 9 9"
      preserveAspectRatio="none"
      aria-hidden="true"
      shape-rendering="crispEdges"
    >
      {#key TRENCH_STRIP_THICKNESS}
        {@const t = TRENCH_STRIP_THICKNESS}
        {@const half = t / 2}
        <defs>
          <linearGradient
            id="grad-outer-top"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1={0.5 - half}
            x2="0"
            y2="0"
          >
            <stop offset="0%" stop-color="#000" stop-opacity="1" />
            <stop offset="100%" stop-color="#000" stop-opacity="0" />
          </linearGradient>
          <linearGradient
            id="grad-outer-bottom"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1={8.5 + half}
            x2="0"
            y2="9"
          >
            <stop offset="0%" stop-color="#000" stop-opacity="1" />
            <stop offset="100%" stop-color="#000" stop-opacity="0" />
          </linearGradient>
          <linearGradient
            id="grad-outer-left"
            gradientUnits="userSpaceOnUse"
            x1={0.5 - half}
            y1="0"
            x2="0"
            y2="0"
          >
            <stop offset="0%" stop-color="#000" stop-opacity="1" />
            <stop offset="100%" stop-color="#000" stop-opacity="0" />
          </linearGradient>
          <linearGradient
            id="grad-outer-right"
            gradientUnits="userSpaceOnUse"
            x1={8.5 + half}
            y1="0"
            x2="9"
            y2="0"
          >
            <stop offset="0%" stop-color="#000" stop-opacity="1" />
            <stop offset="100%" stop-color="#000" stop-opacity="0" />
          </linearGradient>

          <linearGradient
            id="grad-inner-top"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1={0.5 + half}
            x2="0"
            y2="1"
          >
            <stop offset="0%" stop-color="#000" stop-opacity="1" />
            <stop offset="100%" stop-color={BOARD_COLOR} stop-opacity="1" />
          </linearGradient>
          <linearGradient
            id="grad-inner-bottom"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1={8.5 - half}
            x2="0"
            y2="8"
          >
            <stop offset="0%" stop-color="#000" stop-opacity="1" />
            <stop offset="100%" stop-color={BOARD_COLOR} stop-opacity="1" />
          </linearGradient>
          <linearGradient
            id="grad-inner-left"
            gradientUnits="userSpaceOnUse"
            x1={0.5 + half}
            y1="0"
            x2="1"
            y2="0"
          >
            <stop offset="0%" stop-color="#000" stop-opacity="1" />
            <stop offset="100%" stop-color={BOARD_COLOR} stop-opacity="1" />
          </linearGradient>
          <linearGradient
            id="grad-inner-right"
            gradientUnits="userSpaceOnUse"
            x1={8.5 - half}
            y1="0"
            x2="8"
            y2="0"
          >
            <stop offset="0%" stop-color="#000" stop-opacity="1" />
            <stop offset="100%" stop-color={BOARD_COLOR} stop-opacity="1" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="9" height="1" fill="#000" />
        <rect x="0" y="8" width="9" height="1" fill="#000" />
        <rect x="0" y="0" width="1" height="9" fill="#000" />
        <rect x="8" y="0" width="1" height="9" fill="#000" />

        <rect x={0.5 - half} y={0.5 - half} width={t} height={8 + t} fill="#000" />
        <rect x={8.5 - half} y={0.5 - half} width={t} height={8 + t} fill="#000" />
        <rect x={0.5 - half} y={0.5 - half} width={8 + t} height={t} fill="#000" />
        <rect x={0.5 - half} y={8.5 - half} width={8 + t} height={t} fill="#000" />

        {#if SHOW_OUTER_TRAPEZOIDS}
          <polygon
            points={`0,0 9,0 ${8.5 + half},${0.5 - half} ${0.5 - half},${0.5 - half}`}
            fill="url(#grad-outer-top)"
          />
          <polygon
            points={`${0.5 - half},${8.5 + half} ${8.5 + half},${8.5 + half} 9,9 0,9`}
            fill="url(#grad-outer-bottom)"
          />
          <polygon
            points={`0,0 ${0.5 - half},${0.5 - half} ${0.5 - half},${8.5 + half} 0,9`}
            fill="url(#grad-outer-left)"
          />
          <polygon
            points={`${8.5 + half},${0.5 - half} 9,0 9,9 ${8.5 + half},${8.5 + half}`}
            fill="url(#grad-outer-right)"
          />
        {/if}

        <polygon
          points={`${0.5 + half},${0.5 + half} ${8.5 - half},${0.5 + half} 8,1 1,1`}
          fill="url(#grad-inner-top)"
        />
        <polygon
          points={`1,8 8,8 ${8.5 - half},${8.5 - half} ${0.5 + half},${8.5 - half}`}
          fill="url(#grad-inner-bottom)"
        />
        <polygon
          points={`${0.5 + half},${0.5 + half} 1,1 1,8 ${0.5 + half},${8.5 - half}`}
          fill="url(#grad-inner-left)"
        />
        <polygon
          points={`8,1 ${8.5 - half},${0.5 + half} ${8.5 - half},${8.5 - half} 8,8`}
          fill="url(#grad-inner-right)"
        />
      {/key}
    </svg>

    <svg
      class="outline"
      viewBox="0 0 9 9"
      preserveAspectRatio="none"
      aria-hidden="true"
      shape-rendering="crispEdges"
    >
      <rect
        x="1"
        y="1"
        width="7"
        height="7"
        fill="none"
        stroke="#000"
        style="stroke-width:1px; vector-effect:non-scaling-stroke;"
      />
      <line
        x1="1"
        y1="1"
        x2="0"
        y2="0"
        stroke="#000"
        style="stroke-width:1px; vector-effect:non-scaling-stroke;"
      />
      <line
        x1="8"
        y1="1"
        x2="9"
        y2="0"
        stroke="#000"
        style="stroke-width:1px; vector-effect:non-scaling-stroke;"
      />
      <line
        x1="1"
        y1="8"
        x2="0"
        y2="9"
        stroke="#000"
        style="stroke-width:1px; vector-effect:non-scaling-stroke;"
      />
      <line
        x1="8"
        y1="8"
        x2="9"
        y2="9"
        stroke="#000"
        style="stroke-width:1px; vector-effect:non-scaling-stroke;"
      />
    </svg>

    {#if isGameOver}
      <div class="board-overlay"><div class="overlay-text">{gameOverText}</div></div>
    {/if}

    {#if lastAnim.key}
      <div class="anim-layer">
        {#each lastAnim.moves as m, i (i)}
          {@const fromR9 = m.from.r + INNER_START}
          {@const fromC9 = m.from.c + INNER_START}
          {@const toR9 = m.to
            ? m.to.r + INNER_START
            : m.dir === 'U'
              ? fromR9 - 1.0
              : m.dir === 'D'
                ? fromR9 + 1.0
                : fromR9}
          {@const toC9 = m.to
            ? m.to.c + INNER_START
            : m.dir === 'L'
              ? fromC9 - 1.0
              : m.dir === 'R'
                ? fromC9 + 1.0
                : fromC9}
          {@const colorClass = m.color === 'black' ? 'black' : 'white'}
          <div
            class={'stone moving ' + colorClass + (m.type === 'fall' ? ' falling' : ' sliding')}
            style={`--from-r:${fromR9}; --from-c:${fromC9}; --to-r:${toR9}; --to-c:${toC9};`}
            onanimationend={() => {
              animEndCounter = animEndCounter + 1;
              if (animEndCounter >= lastAnim.moves.length) {
                lastAnim = { key: null, moves: [] };
                animEndCounter = 0;
              }
            }}
          ></div>
        {/each}
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
  .shove-wrapper {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }

  .shove-board {
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

  .grid9 {
    display: grid;
    grid-template-columns: repeat(9, var(--cell));
    grid-template-rows: repeat(9, var(--cell));
    position: relative;
    width: 100%;
    height: 100%;
    z-index: 1;
  }

  .cell9 {
    position: relative;
    width: var(--cell);
    height: var(--cell);
    user-select: none;
  }
  .cell9.inner {
    cursor: pointer;
  }

  .cell9.inner::before,
  .cell9.inner::after {
    content: '';
    position: absolute;
    background-color: #111111;
    opacity: 0.9;
    pointer-events: none;
    z-index: 1;
  }
  .cell9.inner::before {
    width: 2px;
    height: 100%;
    left: 50%;
    transform: translateX(-50%);
    top: 0;
  }
  .cell9.inner::after {
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
    z-index: 3;
  }
  .stone.hidden {
    opacity: 0;
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
    z-index: 1;
  }
  .rank-label {
    position: absolute;
    top: 15px;
    left: 6px;
    font-size: 10px;
    font-weight: bold;
    color: rgba(17, 17, 17, 0.7);
    pointer-events: none;
    z-index: 1;
  }

  .trench {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    pointer-events: none;
  }

  .outline {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    pointer-events: none;
  }

  .board-overlay {
    z-index: 6;
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

  .dir-layer {
    position: absolute;
    inset: 0;
    z-index: 5;
  }
  .dir {
    position: absolute;
    width: calc(var(--cell) * 0.28);
    height: calc(var(--cell) * 0.28);
    background: none;
    border: none;
    cursor: pointer;
    z-index: 4;
    pointer-events: auto;
  }
  .dir:hover {
    opacity: 0.9;
  }
  .dir-up {
    top: calc((var(--pr) + 0.2) * var(--cell));
    left: calc((var(--pc) + 0.5) * var(--cell));
    transform: translate(-50%, -50%);
  }
  .dir-down {
    top: calc((var(--pr) + 0.8) * var(--cell));
    left: calc((var(--pc) + 0.5) * var(--cell));
    transform: translate(-50%, -50%);
  }
  .dir-left {
    top: calc((var(--pr) + 0.5) * var(--cell));
    left: calc((var(--pc) + 0.2) * var(--cell));
    transform: translate(-50%, -50%);
  }
  .dir-right {
    top: calc((var(--pr) + 0.5) * var(--cell));
    left: calc((var(--pc) + 0.8) * var(--cell));
    transform: translate(-50%, -50%);
  }

  .dir::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 0;
    height: 0;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-bottom: 12px solid var(--arrow-color, rgba(255, 255, 255, 0.95));
  }
  .dir-layer.on-black {
    --arrow-color: rgba(255, 255, 255, 0.95);
  }
  .dir-layer.on-white {
    --arrow-color: #000;
  }
  .dir-down::before {
    transform: translate(-50%, -50%) rotate(180deg);
  }
  .dir-left::before {
    transform: translate(-50%, -50%) rotate(-90deg);
  }
  .dir-right::before {
    transform: translate(-50%, -50%) rotate(90deg);
  }

  .anim-layer {
    position: absolute;
    inset: 0;
    z-index: 4;
    pointer-events: none;
  }
  .stone.moving {
    position: absolute;
    width: calc(var(--cell) * 0.85);
    height: calc(var(--cell) * 0.85);
    border-radius: 50%;
    top: 0;
    left: 0;
  }
  .stone.moving.sliding {
    animation: slide-one 200ms linear forwards;
  }
  .stone.moving.falling {
    animation: slide-off 650ms linear forwards;
  }

  @keyframes slide-one {
    from {
      transform: translate(
          calc((var(--from-c) + 0.5) * var(--cell)),
          calc((var(--from-r) + 0.5) * var(--cell))
        )
        translate(-50%, -50%);
    }
    to {
      transform: translate(
          calc((var(--to-c) + 0.5) * var(--cell)),
          calc((var(--to-r) + 0.5) * var(--cell))
        )
        translate(-50%, -50%);
    }
  }
  @keyframes slide-off {
    0% {
      transform: translate(
          calc((var(--from-c) + 0.5) * var(--cell)),
          calc((var(--from-r) + 0.5) * var(--cell))
        )
        translate(-50%, -50%);
      opacity: 1;
    }
    60% {
      transform: translate(
          calc((var(--to-c) + 0.5) * var(--cell)),
          calc((var(--to-r) + 0.5) * var(--cell))
        )
        translate(-50%, -50%);
      opacity: 1;
    }
    100% {
      transform: translate(
          calc((var(--to-c) + 0.5) * var(--cell)),
          calc((var(--to-r) + 0.5) * var(--cell))
        )
        translate(-50%, -50%) scale(0.4);
      opacity: 0;
    }
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
