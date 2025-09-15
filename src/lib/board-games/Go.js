export function createGame() {
  const size = 9;
  const board = createInitialBoard(size);
  const currentPlayer = 'black';
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
    gameName: 'go-9x9',
  });
}

function createInitialBoard(size) {
  return Array(size)
    .fill(null)
    .map(() => Array(size).fill(null));
}

function deepCloneBoard(board) {
  return board.map((row) => [...row]);
}

function other(player) {
  return player === 'black' ? 'white' : 'black';
}

function isEmpty(cell) {
  return cell === null;
}
function isStone(cell) {
  return cell === 'black' || cell === 'white';
}

function inBounds(board, r, c) {
  return r >= 0 && r < board.length && c >= 0 && c < board.length;
}

function neighbors(board, r, c) {
  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  const n = [];
  for (const [dr, dc] of dirs) {
    const nr = r + dr;
    const nc = c + dc;
    if (inBounds(board, nr, nc)) n.push([nr, nc]);
  }
  return n;
}

function getGroupAndLiberties(board, r, c) {
  const color = board[r][c];
  if (!isStone(color)) return { group: new Set(), liberties: new Set() };
  const key = (rr, cc) => rr + ',' + cc;

  const group = new Set([key(r, c)]);
  const liberties = new Set();
  const stack = [[r, c]];

  while (stack.length) {
    const [cr, cc] = stack.pop();
    for (const [nr, nc] of neighbors(board, cr, cc)) {
      const cell = board[nr][nc];
      if (isEmpty(cell)) {
        liberties.add(key(nr, nc));
      } else if (cell === color) {
        const k = key(nr, nc);
        if (!group.has(k)) {
          group.add(k);
          stack.push([nr, nc]);
        }
      }
    }
  }

  return { group, liberties };
}

function removeGroup(board, groupSet) {
  for (const coord of groupSet) {
    const [r, c] = coord.split(',').map((x) => parseInt(x, 10));
    board[r][c] = null;
  }
}

function boardSignature(board) {
  // A simple positional signature for superko checks
  // b = black, w = white, . = empty; rows separated by '/'
  return board
    .map((row) =>
      row.map((cell) => (cell === 'black' ? 'b' : cell === 'white' ? 'w' : '.')).join('')
    )
    .join('/');
}

function priorPositionSet(game) {
  const set = new Set();
  set.add(boardSignature(game.board));
  for (const s of game.history) {
    set.add(boardSignature(s.board));
  }
  return set;
}

function wouldBeLegalPlacement(game, row, col) {
  if (game.gameOver) return false;
  if (!inBounds(game.board, row, col)) return false;
  if (!isEmpty(game.board[row][col])) return false;

  const player = game.currentPlayer;
  const opponent = other(player);

  const trial = deepCloneBoard(game.board);
  trial[row][col] = player;

  for (const [nr, nc] of neighbors(trial, row, col)) {
    if (trial[nr][nc] === opponent) {
      const { group, liberties } = getGroupAndLiberties(trial, nr, nc);
      if (liberties.size === 0) {
        removeGroup(trial, group);
      }
    }
  }

  const { liberties: myLibs } = getGroupAndLiberties(trial, row, col);
  if (myLibs.size === 0) {
    return false;
  }

  // superko: resulting board may not match any former board position
  const sig = boardSignature(trial);
  const prior = priorPositionSet(game);
  if (prior.has(sig)) {
    return false;
  }

  return true;
}

export function getAllValidMoves(game) {
  const moves = [];
  if (game.gameOver) return moves;

  for (let r = 0; r < game.board.length; r++) {
    for (let c = 0; c < game.board.length; c++) {
      if (game.board[r][c] === null && wouldBeLegalPlacement(game, r, c)) {
        moves.push({ type: 'place', row: r, col: c });
      }
    }
  }
  moves.push({ type: 'pass' });

  return moves;
}

export function makeMove(game, move) {
  if (game.gameOver) return game;
  if (!move || (move.type !== 'pass' && move.type !== 'place')) return game;

  const state = {
    board: deepCloneBoard(game.board),
    currentPlayer: game.currentPlayer,
    move,
  };

  if (move.type === 'pass') {
    // two consecutive passes end the game
    const newHistory = [...game.history, state];
    const prev = game.history[game.history.length - 1];
    const newGame = {
      board: game.board,
      currentPlayer: other(game.currentPlayer),
      history: newHistory,
      gameOver: false,
      gameName: game.gameName,
    };

    const prevMove = prev?.move;
    if (prevMove && prevMove.type === 'pass') {
      const { winner } = scoreFinalPosition(newGame.board);
      newGame.gameOver = winner || 'draw';
    }

    return Object.freeze(newGame);
  }

  const { row, col } = move;
  if (!wouldBeLegalPlacement(game, row, col)) return game;

  const player = game.currentPlayer;
  const opponent = other(player);
  const newBoard = deepCloneBoard(game.board);
  newBoard[row][col] = player;

  for (const [nr, nc] of neighbors(newBoard, row, col)) {
    if (newBoard[nr][nc] === opponent) {
      const { group, liberties } = getGroupAndLiberties(newBoard, nr, nc);
      if (liberties.size === 0) {
        removeGroup(newBoard, group);
      }
    }
  }

  const { liberties: libsAfter } = getGroupAndLiberties(newBoard, row, col);
  if (libsAfter.size === 0) {
    return game;
  }

  return Object.freeze({
    board: newBoard,
    currentPlayer: other(game.currentPlayer),
    history: [...game.history, state],
    gameOver: false,
    gameName: game.gameName,
  });
}

function scoreFinalPosition(board) {
  const work = deepCloneBoard(board);
  let removed;
  do {
    removed = false;
    const seen = new Set();
    for (let r = 0; r < work.length; r++) {
      for (let c = 0; c < work.length; c++) {
        if (work[r][c]) {
          const { group, liberties } = getGroupAndLiberties(work, r, c);
          for (const k of group) seen.add(k);
          if (liberties.size === 0) {
            removeGroup(work, group);
            removed = true;
          }
        }
      }
    }
  } while (removed);

  let blackStones = 0;
  let whiteStones = 0;
  for (let r = 0; r < work.length; r++) {
    for (let c = 0; c < work.length; c++) {
      if (work[r][c] === 'black') blackStones++;
      else if (work[r][c] === 'white') whiteStones++;
    }
  }

  // Territory via flood fill of empty regions
  const visited = new Set();
  const key = (rr, cc) => rr + ',' + cc;
  let blackTerr = 0;
  let whiteTerr = 0;

  for (let r = 0; r < work.length; r++) {
    for (let c = 0; c < work.length; c++) {
      if (work[r][c] !== null) continue;
      const startK = key(r, c);
      if (visited.has(startK)) continue;

      const region = [];
      const borderColors = new Set();
      const stack = [[r, c]];
      visited.add(startK);
      while (stack.length) {
        const [cr, cc] = stack.pop();
        region.push([cr, cc]);
        for (const [nr, nc] of neighbors(work, cr, cc)) {
          const cell = work[nr][nc];
          if (cell === null) {
            const k2 = key(nr, nc);
            if (!visited.has(k2)) {
              visited.add(k2);
              stack.push([nr, nc]);
            }
          } else if (cell === 'black' || cell === 'white') {
            borderColors.add(cell);
          }
        }
      }

      if (borderColors.size === 1) {
        const only = [...borderColors][0];
        if (only === 'black') blackTerr += region.length;
        else if (only === 'white') whiteTerr += region.length;
      }
    }
  }

  const blackScore = blackStones + blackTerr;
  const whiteScore = whiteStones + whiteTerr;

  let winner = null;
  if (blackScore > whiteScore) winner = 'black';
  else if (whiteScore > blackScore) winner = 'white';
  // else draw

  return { blackScore, whiteScore, winner };
}

export function boardToString(board) {
  const size = board.length;
  const files = 'abcdefghi'.slice(0, size).split('');
  let str = '  ' + files.join(' ') + '\n';
  for (let r = 0; r < size; r++) {
    const rank = size - r;
    let line = rank + ' ';
    for (let c = 0; c < size; c++) {
      const cell = board[r][c];
      line += (cell === 'black' ? 'B' : cell === 'white' ? 'W' : '.') + ' ';
    }
    str += line.trimEnd() + '\n';
  }
  return str.trimEnd();
}

export function gameStateToString(game) {
  const latestState = game.history[game.history.length - 1];
  const latestMove = latestState?.move;
  // Return game state in the following format:
  //
  // Player: black
  // Previous Move: a8
  // Game Status: ongoing
  // Board:
  //   a b c d e f g h i
  // 9 . . . . . . . . .
  // 8 W . . B W . . . .
  // 7 . B . . W B . . .
  // 6 . . . W B . B . .
  // 5 . . . . W B W . .
  // 4 B . B . B . B . .
  // 3 . . . W . W . B W
  // 2 . W . W . . . . .
  // 1 . . . . . . B . .
  return `
Player: ${game.currentPlayer}
Previous Move: ${latestMove ? moveToMoveStr(latestMove) : 'None'}
Game Status: ${getGameStatus(game)}
Board:
${boardToString(game.board)}
`;
}

export function rules() {
  return `
Go (9x9) rules (simplified area scoring):
- The board starts empty. Black moves first; players alternate.
- A move places a single stone of your color on any empty intersection, or you may pass.
- A connected group is formed by stones of the same color connected orthogonally (up/down/left/right).
- A liberty is an empty intersection next to a group of stones.
- Capturing: If all intersections adjacent to a group are occupied by the opponent (i.e., the group has no liberties), that group is captured and removed immediately.
- Suicide is not allowed: you may not play a stone that would leave your own group with no liberties, unless the move first captures adjacent enemy stones, thereby creating liberties.
- Ko/superko: You may not play a move that recreates any previous board position.
- Two consecutive passes end the game.
- Scoring: Each player's score is the number of intersections they occupy (stones on the board) plus the number of empty intersections that are completely surrounded by only their stones. Empty regions bordered by both colors are neutral and score for neither player. At the end, any stones with no liberties are removed as captured before scoring.

When viewing a text representation of the board state, B = black, W = white, and . = empty.
`;
}

export function moveToMoveStr(move) {
  if (!move) return 'N/A';
  if (move.type === 'pass') return 'pass';
  if (move.type === 'place') {
    const files = 'abcdefghi';
    const file = files[move.col];
    const rank = 9 - move.row; // top row is 9
    return `${file}${rank}`;
  }
  return 'N/A';
}

export function parseMoveStr(moveStr, validMoves) {
  if (!moveStr) return null;
  const s = moveStr.trim().toLowerCase();
  if (s === 'pass') return validMoves.find((m) => m.type === 'pass') || null;
  // coordinates like 'd4'
  const files = 'abcdefghi';
  const m = /^([a-i])(\d)$/.exec(s);
  if (!m) return null;
  const col = files.indexOf(m[1]);
  const rank = parseInt(m[2], 10);
  const row = 9 - rank;
  const key = (mv) => (mv.type === 'place' ? `${mv.row},${mv.col}` : mv.type);
  const targetKey = `${row},${col}`;
  return validMoves.find((mv) => key(mv) === targetKey) || null;
}

export function llmPrompt(game) {
  const NUM_PREVIOUS_MOVES = 50;
  const validMoves = getAllValidMoves(game);
  const prevCount = Math.min(NUM_PREVIOUS_MOVES, Math.max(0, game.history.length - 1));
  return `
You are playing 9x9 Go. Analyze extremely carefully and choose the best move. You are playing ${game.currentPlayer}.

Notation:
- Use coordinates like a9 (top-left) through i1 (bottom-right), or the word pass.
- Columns are a..i left-to-right; rows are 9..1 from top to bottom.

Rules:
${rules()}

Here are the past ${prevCount} board states/moves (if any):
${
  prevCount > 0
    ? game.history
        .slice(-prevCount)
        .map(
          (state) =>
            `${boardToString(state.board)}\n${state.move ? moveToMoveStr(state.move) : 'None'}`
        )
        .join('\n')
    : ''
}

This is the current board state:
${gameStateToString(game)}

The following moves are currently legal:
${validMoves.map((mv) => moveToMoveStr(mv)).join('\n')}

Now choose your move. Verify it is legal. The last line of your response should be just the move (e.g., d4 or pass).
`;
}

export function getGameStatus(game) {
  if (game.gameOver === 'black' || game.gameOver === 'white') return game.gameOver;
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
  if (status === 'black') return 'Black wins!';
  if (status === 'white') return 'White wins!';
  return '';
}

export function reset() {
  return createGame();
}
