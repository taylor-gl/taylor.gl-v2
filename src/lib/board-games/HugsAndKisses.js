export function createGame() {
  const board = createInitialBoard();
  const currentPlayer = 'red';
  const state = {
    board: deepCloneBoard(board),
    currentPlayer,
    move: null,
  };

  return Object.freeze({
    board,
    currentPlayer,
    history: [state],
    gameOver: false,
    gameName: 'hugs-and-kisses',
  });
}

function isX(cell) {
  return !!cell && cell.symbol === 'X';
}

function isO(cell) {
  return !!cell && cell.symbol === 'O';
}

function tileInAnyDiagonalXXX(board, row, col) {
  if (
    row - 1 >= 0 &&
    col - 1 >= 0 &&
    row + 1 < 6 &&
    col + 1 < 7 &&
    isX(board[row - 1][col - 1]) &&
    isX(board[row][col]) &&
    isX(board[row + 1][col + 1])
  )
    return true;
  if (
    row - 1 >= 0 &&
    col + 1 < 7 &&
    row + 1 < 6 &&
    col - 1 >= 0 &&
    isX(board[row - 1][col + 1]) &&
    isX(board[row][col]) &&
    isX(board[row + 1][col - 1])
  )
    return true;
  if (
    row + 2 < 6 &&
    col + 2 < 7 &&
    isX(board[row][col]) &&
    isX(board[row + 1][col + 1]) &&
    isX(board[row + 2][col + 2])
  )
    return true;
  if (
    row + 2 < 6 &&
    col - 2 >= 0 &&
    isX(board[row][col]) &&
    isX(board[row + 1][col - 1]) &&
    isX(board[row + 2][col - 2])
  )
    return true;
  if (
    row - 2 >= 0 &&
    col - 2 >= 0 &&
    isX(board[row - 2][col - 2]) &&
    isX(board[row - 1][col - 1]) &&
    isX(board[row][col])
  )
    return true;
  if (
    row - 2 >= 0 &&
    col + 2 < 7 &&
    isX(board[row - 2][col + 2]) &&
    isX(board[row - 1][col + 1]) &&
    isX(board[row][col])
  )
    return true;
  return false;
}

function tileInAnyHorizontalOOO(board, row, col) {
  if (
    col - 1 >= 0 &&
    col + 1 < 7 &&
    isO(board[row][col - 1]) &&
    isO(board[row][col]) &&
    isO(board[row][col + 1])
  )
    return true;
  if (col + 2 < 7 && isO(board[row][col]) && isO(board[row][col + 1]) && isO(board[row][col + 2]))
    return true;
  if (col - 2 >= 0 && isO(board[row][col - 2]) && isO(board[row][col - 1]) && isO(board[row][col]))
    return true;
  return false;
}

function isOXOHorizontalAt(board, row, col) {
  return (
    col - 1 >= 0 &&
    col + 1 < 7 &&
    isO(board[row][col - 1]) &&
    isX(board[row][col]) &&
    isO(board[row][col + 1])
  );
}

function isXOXDiagonalAtCenter(board, row, col) {
  if (
    row - 1 >= 0 &&
    col - 1 >= 0 &&
    row + 1 < 6 &&
    col + 1 < 7 &&
    isX(board[row - 1][col - 1]) &&
    isO(board[row][col]) &&
    isX(board[row + 1][col + 1])
  )
    return true;
  if (
    row - 1 >= 0 &&
    col + 1 < 7 &&
    row + 1 < 6 &&
    col - 1 >= 0 &&
    isX(board[row - 1][col + 1]) &&
    isO(board[row][col]) &&
    isX(board[row + 1][col - 1])
  )
    return true;
  return false;
}

export function boardToString(board) {
  let str = '0 1 2 3 4 5 6\n';
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 7; col++) {
      const cell = board[row][col];
      const ch = cell ? (cell.symbol === 'O' ? 'O' : cell.symbol === 'X' ? 'X' : 'I') : '.';
      str += ch + ' ';
    }
    str += '\n';
  }
  return str;
}

export function gameStateToString(game) {
  const latestState = game.history[game.history.length - 1];
  const latestMove = latestState?.move;
  // Return game state in the following format:
  //
  // Player: red
  // Previous Move: 2
  // Game Status: ongoing
  // Board:
  // 0 1 2 3 4 5 6
  // . . . . . . .
  // . . . . . . .
  // . . . . . . .
  // . X . X . . .
  // . O I O . . .
  // O O O X X . .
  return `
Player: ${game.currentPlayer}
Previous Move: ${latestMove !== null && latestMove !== undefined ? latestMove : 'None'}
Game Status: ${getGameStatus(game)}
Board:
${boardToString(game.board)}
`;
}

export function rules() {
  return `
- Hugs and Kisses is a game where each player tries to build matches of three discs of their color while preventing the other player from doing the same. The game takes place on a grid with 7 columns and 6 rows, and discs are inserted from the top, similarly to Connect 4.
- Player 1 places red discs marked with an 'O', and Player 2 places yellow discs marked with an X. Players alternate turns, with Player 1 (red Os) going first. You can drop discs in any column unless the column is full.
- If three X discs are placed diagonally in a row, they form a match, and become "locked in". If three O discs are placed horizontally in a row, they form a match, and become "locked in". Locked in discs cannot change. Vertical 3-of-a-kind does not count for either player.
- If three discs diagonally would form an XXX match, but the middle disc is an O, the middle disc flips to an X, forming an XXX match.
- If three discs horizontally would form an OOO match, but the middle disc is an X, the middle disc flips to an O, forming an OOO match.
- Locked in discs cannot be flipped, so an XOX match will not become an XXX match, and an OXO match will not become an OOO match, if the central tile is locked in. Locked in tiles can become part of other matches, however. For example, OOOO counts as two matches.
- If a disc would flip to both an X and an O in the same turn, it becomes an "infinity" disc, which is locked-in and cannot change. Infinity discs counts as both X and O for the purposes of matching.
- At the end of the game, the player with the most locked-in discs wins the game. If equal, the game is a draw.

When viewing a text representation of the board state, X = red X, O = yellow O, I = infinity, and . = empty.`;
}

export function llmPrompt(game) {
  const NUM_PREVIOUS_MOVES = 50;
  const validMoves = getAllValidMoves(game);
  const prevCount = Math.min(NUM_PREVIOUS_MOVES, Math.max(0, game.history.length - 1));
  return `
You are playing Hugs and Kisses. Analyze carefully and choose the best move. You are playing ${game.currentPlayer}.

The rules of the game are as follows:
${rules()}

Here are the past ${prevCount} board states/moves (if any):
${
  prevCount > 0
    ? game.history
        .slice(-prevCount)
        .map((state) => `${boardToString(state.board)}\n${state.move}`)
        .join('\n')
    : ''
}

This is the current board state:
${gameStateToString(game)}

The following moves (column numbers) are currently legal:
${validMoves.join(', ')}

Now choose your move. Always verify your move is legal according to the piece rules before committing to it. Choose the best move possible to win the game. Your response format can be whatever you want, but the last line of your response should simply be the column number, without any other content.
`;
}

function createInitialBoard() {
  return Array(6)
    .fill(null)
    .map(() => Array(7).fill(null));
}

function deepCloneBoard(board) {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

function getAvailableRow(board, col) {
  for (let row = 5; row >= 0; row--) {
    if (board[row][col] === null) {
      return row;
    }
  }
  return null;
}

function isValidMove(game, col) {
  if (col < 0 || col > 6) return false;
  if (game.gameOver) return false;
  return game.board[0][col] === null;
}

export function makeMove(game, col) {
  if (!isValidMove(game, col)) return game;

  const state = {
    board: deepCloneBoard(game.board),
    currentPlayer: game.currentPlayer,
    move: col,
  };

  const newBoard = deepCloneBoard(game.board);
  const row = getAvailableRow(newBoard, col);
  if (row === null) return game;

  const isRed = game.currentPlayer === 'red';
  newBoard[row][col] = {
    color: isRed ? 'red' : 'yellow',
    symbol: isRed ? 'O' : 'X',
    active: false,
  };

  if (newBoard[row][col].symbol === 'X') {
    if (isOXOHorizontalAt(newBoard, row, col) && tileInAnyDiagonalXXX(newBoard, row, col)) {
      newBoard[row][col] = { color: 'gray', symbol: 'I', active: true };
    }
  } else if (newBoard[row][col].symbol === 'O') {
    if (isXOXDiagonalAtCenter(newBoard, row, col) && tileInAnyHorizontalOOO(newBoard, row, col)) {
      newBoard[row][col] = { color: 'gray', symbol: 'I', active: true };
    }
  }

  while (true) {
    const flips = findFlips(newBoard);
    if (flips.length === 0) break;
    for (const { row: r, col: c, to } of flips) {
      const tile = newBoard[r][c];
      if (!tile || tile.active) continue;
      if (to === 'I') {
        tile.symbol = 'I';
        tile.color = 'gray';
        tile.active = true;
      } else if (to === 'X') {
        tile.symbol = 'X';
        tile.color = 'yellow';
      } else if (to === 'O') {
        tile.symbol = 'O';
        tile.color = 'red';
      }
      // Flipping does not immediately cause activation, but that happens in the next step
      if (to !== 'I') tile.active = tile.active || false;
    }
  }
  applyActivations(newBoard);

  const boardFull = isBoardFull(newBoard);
  let gameOver = false;
  if (boardFull) {
    const { redActive, yellowActive } = countActive(newBoard);
    if (redActive > yellowActive) gameOver = 'red';
    else if (yellowActive > redActive) gameOver = 'yellow';
    else gameOver = 'draw';
  }

  return Object.freeze({
    board: newBoard,
    currentPlayer: game.currentPlayer === 'red' ? 'yellow' : 'red',
    history: [...game.history, state],
    gameOver,
    gameName: 'hugs-and-kisses',
  });
}

function findFlips(board) {
  // Aggregate flip intents (from incomplete patterns) and perfect intents
  // (XXX or OOO, used for detecting when to place Infinity discs)
  const flipIntents = new Map(); // key: 'r,c' -> Set('O'|'X')
  const perfectIntents = new Map(); // key: 'r,c' -> Set('O'|'X')

  function addFlipIntent(r, c, to) {
    const center = board[r][c];
    if (!center || center.active || center.symbol === 'I') return;
    const key = `${r},${c}`;
    let set = flipIntents.get(key);
    if (!set) {
      set = new Set();
      flipIntents.set(key, set);
    }
    set.add(to);
  }

  function addPerfectIntent(r, c, to) {
    const key = `${r},${c}`;
    let set = perfectIntents.get(key);
    if (!set) {
      set = new Set();
      perfectIntents.set(key, set);
    }
    set.add(to);
  }

  // Incomplete patterns that cause flips
  // Horizontal OXO -> flip middle to O (strict symbols; Infinity doesn't create flips)
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c <= 4; c++) {
      const a = board[r][c];
      const b = board[r][c + 1];
      const d = board[r][c + 2];
      if (a && b && d) {
        if (a.symbol === 'O' && d.symbol === 'O' && b.symbol === 'X') {
          addFlipIntent(r, c + 1, 'O');
        }
      }
    }
  }

  // Diagonal XOX -> flip middle to X (down-right)
  for (let r = 0; r <= 3; r++) {
    for (let c = 0; c <= 4; c++) {
      const a = board[r][c];
      const b = board[r + 1][c + 1];
      const d = board[r + 2][c + 2];
      if (a && b && d) {
        if (a.symbol === 'X' && d.symbol === 'X' && b.symbol === 'O') {
          addFlipIntent(r + 1, c + 1, 'X');
        }
      }
    }
  }

  // Diagonal XOX -> flip middle to X (down-left)
  for (let r = 0; r <= 3; r++) {
    for (let c = 2; c < 7; c++) {
      const a = board[r][c];
      const b = board[r + 1][c - 1];
      const d = board[r + 2][c - 2];
      if (a && b && d) {
        if (a.symbol === 'X' && d.symbol === 'X' && b.symbol === 'O') {
          addFlipIntent(r + 1, c - 1, 'X');
        }
      }
    }
  }

  // Perfect matches (Infinity counts as both for matching)
  // Horizontal OOO
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c <= 4; c++) {
      const a = board[r][c];
      const b = board[r][c + 1];
      const d = board[r][c + 2];
      if (
        a &&
        b &&
        d &&
        (a.symbol === 'O' || a.symbol === 'I') &&
        (b.symbol === 'O' || b.symbol === 'I') &&
        (d.symbol === 'O' || d.symbol === 'I')
      ) {
        addPerfectIntent(r, c, 'O');
        addPerfectIntent(r, c + 1, 'O');
        addPerfectIntent(r, c + 2, 'O');
      }
    }
  }

  // Diagonal XXX (down-right)
  for (let r = 0; r <= 3; r++) {
    for (let c = 0; c <= 4; c++) {
      const a = board[r][c];
      const b = board[r + 1][c + 1];
      const d = board[r + 2][c + 2];
      if (
        a &&
        b &&
        d &&
        (a.symbol === 'X' || a.symbol === 'I') &&
        (b.symbol === 'X' || b.symbol === 'I') &&
        (d.symbol === 'X' || d.symbol === 'I')
      ) {
        addPerfectIntent(r, c, 'X');
        addPerfectIntent(r + 1, c + 1, 'X');
        addPerfectIntent(r + 2, c + 2, 'X');
      }
    }
  }

  // Diagonal XXX (down-left)
  for (let r = 0; r <= 3; r++) {
    for (let c = 2; c < 7; c++) {
      const a = board[r][c];
      const b = board[r + 1][c - 1];
      const d = board[r + 2][c - 2];
      if (
        a &&
        b &&
        d &&
        (a.symbol === 'X' || a.symbol === 'I') &&
        (b.symbol === 'X' || b.symbol === 'I') &&
        (d.symbol === 'X' || d.symbol === 'I')
      ) {
        addPerfectIntent(r, c, 'X');
        addPerfectIntent(r + 1, c - 1, 'X');
        addPerfectIntent(r + 2, c - 2, 'X');
      }
    }
  }

  // Resolve: Only tiles with flip intents can flip.
  // If a tile has conflicting flip intents (O and X), or a flip intent conflicting with a perfect intent, it becomes Infinity.
  const flips = [];
  for (const [key, flipSet] of flipIntents.entries()) {
    const perfectSet = perfectIntents.get(key) || new Set();
    const [rs, cs] = key.split(',');
    const r = Number(rs);
    const c = Number(cs);
    const hasFlipO = flipSet.has('O');
    const hasFlipX = flipSet.has('X');
    const hasPerfectO = perfectSet.has('O');
    const hasPerfectX = perfectSet.has('X');

    if ((hasFlipO && hasFlipX) || (hasFlipO && hasPerfectX) || (hasFlipX && hasPerfectO)) {
      flips.push({ row: r, col: c, to: 'I' });
    } else if (hasFlipO) {
      flips.push({ row: r, col: c, to: 'O' });
    } else if (hasFlipX) {
      flips.push({ row: r, col: c, to: 'X' });
    }
  }
  return flips;
}

function applyActivations(board) {
  // Horizontal OOO (I counts as O) -> activate
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c <= 4; c++) {
      const a = board[r][c];
      const b = board[r][c + 1];
      const d = board[r][c + 2];
      if (
        a &&
        b &&
        d &&
        (a.symbol === 'O' || a.symbol === 'I') &&
        (b.symbol === 'O' || b.symbol === 'I') &&
        (d.symbol === 'O' || d.symbol === 'I')
      ) {
        a.active = true;
        b.active = true;
        d.active = true;
      }
    }
  }

  // Diagonal XXX (I counts as X) -> activate (down-right)
  for (let r = 0; r <= 3; r++) {
    for (let c = 0; c <= 4; c++) {
      const a = board[r][c];
      const b = board[r + 1][c + 1];
      const d = board[r + 2][c + 2];
      if (
        a &&
        b &&
        d &&
        (a.symbol === 'X' || a.symbol === 'I') &&
        (b.symbol === 'X' || b.symbol === 'I') &&
        (d.symbol === 'X' || d.symbol === 'I')
      ) {
        a.active = true;
        b.active = true;
        d.active = true;
      }
    }
  }

  // Diagonal XXX (I counts as X) -> activate (down-left)
  for (let r = 0; r <= 3; r++) {
    for (let c = 2; c < 7; c++) {
      const a = board[r][c];
      const b = board[r + 1][c - 1];
      const d = board[r + 2][c - 2];
      if (
        a &&
        b &&
        d &&
        (a.symbol === 'X' || a.symbol === 'I') &&
        (b.symbol === 'X' || b.symbol === 'I') &&
        (d.symbol === 'X' || d.symbol === 'I')
      ) {
        a.active = true;
        b.active = true;
        d.active = true;
      }
    }
  }
}

export function getAllValidMoves(game) {
  const moves = [];
  for (let col = 0; col < 7; col++) {
    if (isValidMove(game, col)) moves.push(col);
  }
  return moves;
}

function isBoardFull(board) {
  return board.every((row) => row.every((cell) => cell !== null));
}

function countActive(board) {
  let redActive = 0;
  let yellowActive = 0;
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 7; c++) {
      const cell = board[r][c];
      if (cell && cell.active) {
        if (cell.symbol === 'I') {
          redActive++;
          yellowActive++;
        } else if (cell.color === 'red') redActive++;
        else if (cell.color === 'yellow') yellowActive++;
      }
    }
  }
  return { redActive, yellowActive };
}

export function getGameStatus(game) {
  if (game.gameOver === 'red' || game.gameOver === 'yellow') return game.gameOver;
  if (game.gameOver === 'draw') return 'draw';
  return 'ongoing';
}

export function undo(game) {
  if (game.history.length === 0) return game;
  const state = game.history[game.history.length - 1];
  return Object.freeze({
    board: deepCloneBoard(state.board),
    currentPlayer: state.currentPlayer,
    history: game.history.slice(0, -1),
    gameOver: false,
    gameName: game.gameName,
  });
}

export function gameIsOver(game) {
  return getGameStatus(game) !== 'ongoing';
}

export function gameOverText(game) {
  const status = getGameStatus(game);
  if (status === 'draw') return 'Draw';
  if (status === 'red' || status === 'yellow') {
    const winner = status === 'red' ? 'Red' : 'Yellow';
    return `${winner} wins!`;
  }
  return '';
}

export function reset() {
  return createGame();
}
