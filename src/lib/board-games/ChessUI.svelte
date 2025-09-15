<script>
  import 'iconify-icon';
  import { createEventDispatcher } from 'svelte';
  import { getGameName } from '$lib/board-games/Game.js';

  const dispatch = createEventDispatcher();

  let { game, selectedSquare = $bindable(null), humanCanMove = true } = $props();

  const R = $derived(getGameName(game));

  const isGameOver = $derived(R.gameIsOver(game));
  const gameOverText = $derived(R.gameOverText(game));

  const legalMoves = $derived(
    selectedSquare ? R.getValidMoves(game, selectedSquare.row, selectedSquare.col) : []
  );
  const legalMoveSet = $derived(new Set(legalMoves.map((move) => `${move.toRow},${move.toCol}`)));

  const prevMoveSquares = $derived(R.getPrevMoveSquares(game));

  const prevMoveSquareSet = $derived(
    new Set(prevMoveSquares.map(({ row, col }) => `${row},${col}`))
  );

  $effect(() => {
    void game;
    selectedSquare = null;
  });

  function handleSquareClick(row, col) {
    if (!humanCanMove) return;
    const piece = game.board[row][col];
    const currentPlayerColor = game.currentPlayer;

    if (selectedSquare) {
      if (legalMoveSet.has(`${row},${col}`)) {
        // Execute
        const move = legalMoves.find((m) => m.toRow === row && m.toCol === col);
        dispatch('move', move);
        selectedSquare = null;
      } else if (piece && R.getPieceColor(piece) === currentPlayerColor) {
        // Select a new piece of the current player
        selectedSquare = { row, col };
      } else {
        // Deselect
        selectedSquare = null;
      }
    } else {
      if (piece && R.getPieceColor(piece) === currentPlayerColor) {
        selectedSquare = { row, col };
      }
    }
  }

  function getIconName(piece, gameName) {
    if (!piece) return '';

    const pieceType = piece.toLowerCase();

    if (gameName === 'regular-chess') {
      const chessIcons = {
        k: 'game-icons:chess-king',
        q: 'game-icons:chess-queen',
        b: 'game-icons:chess-bishop',
        n: 'game-icons:chess-knight',
        r: 'game-icons:chess-rook',
        p: 'game-icons:chess-pawn',
      };
      return chessIcons[pieceType] || piece;
    } else {
      const fantasticalIcons = {
        k: 'game-icons:chess-king',
        w: 'fa7-solid:hat-wizard',
        b: 'mdi:bow-arrow',
        n: 'game-icons:ninja-star',
        a: 'game-icons:potion-ball',
        c: 'game-icons:catapult',
        f: 'game-icons:flatfish',
        s: 'game-icons:shark-jaws',
      };
      return fantasticalIcons[pieceType] || piece;
    }
  }
</script>

<div class="board">
  {#each game.board as row, rowIndex (rowIndex)}
    {#each row as piece, colIndex (colIndex)}
      {@const isSelected = selectedSquare?.row === rowIndex && selectedSquare?.col === colIndex}
      {@const isLegalMove = legalMoveSet.has(`${rowIndex},${colIndex}`)}
      {@const isLight = (rowIndex + colIndex) % 2 === 0}
      {@const pieceIsWhite = piece !== null && piece === piece.toLowerCase()}
      {@const isPrevMoveSquare = prevMoveSquareSet.has(`${rowIndex},${colIndex}`)}

      <div
        class="square"
        class:light={isLight}
        class:dark={!isLight}
        class:selected={isSelected}
        class:legal-move={isLegalMove}
        class:legal-capture={isLegalMove && piece}
        class:prev-move-square={isPrevMoveSquare}
        role="button"
        tabindex="0"
        onclick={() => handleSquareClick(rowIndex, colIndex)}
        onkeydown={(e) => e.key === 'Enter' && handleSquareClick(rowIndex, colIndex)}
      >
        {#if piece}
          <span class="piece" class:white={pieceIsWhite} class:black={!pieceIsWhite}>
            <iconify-icon class="icon" icon={getIconName(piece, game.gameName)}></iconify-icon>
          </span>
        {/if}

        {#if isLegalMove && !piece}
          <div class="move-indicator"></div>
        {/if}

        <!-- Coordinate labels -->
        {#if rowIndex === 7}
          <div class="file-label">{String.fromCharCode(97 + colIndex)}</div>
        {/if}
        {#if colIndex === 0}
          <div class="rank-label">{8 - rowIndex}</div>
        {/if}
      </div>
    {/each}
  {/each}
  {#if isGameOver}
    <div class="board-overlay">
      <div class="overlay-text">{gameOverText}</div>
    </div>
  {/if}
</div>

<style>
  .board {
    display: grid;
    grid-template-columns: repeat(8, 70px);
    grid-template-rows: repeat(8, 70px);
    border: 3px solid #111111;
    border-radius: 8px;
    overflow: hidden;
    position: relative;
  }

  .square {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    cursor: pointer;
    user-select: none;
  }

  .square:focus {
    outline: 3px solid rgba(82, 54, 32, 0.5);
    outline-offset: -3px;
  }

  .square.light {
    background-color: #f0d9b5;
  }

  .square.dark {
    background-color: #b58863;
  }

  .square.selected.dark {
    background-color: #8c6341 !important;
  }

  .square.selected.light {
    background-color: #b39e7f !important;
  }

  .square.prev-move-square::before {
    z-index: 10;
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(87, 159, 201, 0.5);
    pointer-events: none;
  }

  .square.legal-move::before,
  .square.legal-capture::before {
    z-index: 10;
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(19, 171, 66, 0.3);
    pointer-events: none;
  }

  .file-label {
    position: absolute;
    bottom: 2px;
    right: 4px;
    font-size: 10px;
    font-weight: bold;
    pointer-events: none;
  }

  .light .file-label {
    color: #b58863;
  }

  .dark .file-label {
    color: #f0d9b5;
  }

  .rank-label {
    position: absolute;
    top: 2px;
    left: 4px;
    font-size: 10px;
    font-weight: bold;
    pointer-events: none;
  }

  .light .rank-label {
    color: #b58863;
  }

  .dark .rank-label {
    color: #f0d9b5;
  }

  .piece {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 3.5rem;
    pointer-events: none;
  }

  .piece.white {
    color: #ffffff;
  }

  .piece.black {
    color: #111111;
  }

  .icon {
    z-index: 20;
  }

  .move-indicator {
    z-index: 10;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: rgba(82, 54, 32, 0.5);
  }

  .board-overlay {
    z-index: 30;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
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
