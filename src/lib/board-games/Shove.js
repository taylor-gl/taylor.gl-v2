export function createGame() {
  const size = 7;
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
    gameName: 'shove',
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

function neighbors4(r, c) {
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
  // A stone is part of a boulder if it belongs to any 2x2 same-color block fully on-board
  const anchors = [
    [r - 1, c - 1],
    [r - 1, c],
    [r, c - 1],
    [r, c],
  ];
  for (const [ar, ac] of anchors) {
    if (!inBounds(board, ar, ac)) continue;
    if (!inBounds(board, ar + 1, ac + 1)) continue;
    const s1 = board[ar][ac];
    const s2 = board[ar][ac + 1];
    const s3 = board[ar + 1][ac];
    const s4 = board[ar + 1][ac + 1];
    if (s1 && s2 && s3 && s4 && s1 === s2 && s2 === s3 && s3 === s4) {
      return true;
    }
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
    for (const [nr, nc] of neighbors4(cr, cc)) {
      if (!inBounds(board, nr, nc)) continue;
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

const DIRS = {
  U: [-1, 0],
  D: [1, 0],
  L: [0, -1],
  R: [0, 1],
};

function dirList() {
  return ['U', 'D', 'L', 'R'];
}

function simulateShift(board, groupSet, dir) {
  // Returns { ok, outBoard } where ok=false if a boulder would need to be pushed.
  const [dr, dc] = DIRS[dir];
  const size = board.length;
  const out = deepCloneBoard(board);

  const groupCells = [];
  for (const k of groupSet) {
    const [r, c] = k.split(',').map((x) => parseInt(x, 10));
    groupCells.push([r, c]);
    out[r][c] = null;
  }

  function processLine(index) {
    const cellsInLine = groupCells.filter(([r, c]) => (dr === 0 ? r === index : c === index));
    if (cellsInLine.length === 0) return true;

    const sorted = cellsInLine.sort((a, b) => {
      if (dr === 0) {
        return dc > 0 ? a[1] - b[1] : b[1] - a[1];
      } else {
        return dr > 0 ? a[0] - b[0] : b[0] - a[0];
      }
    });

    const toPush = new Set();
    for (const [r, c] of sorted) {
      const nr = r + dr;
      const nc = c + dc;
      if (!inBounds(out, nr, nc)) {
        continue;
      }
      let cr = nr;
      let cc = nc;
      while (inBounds(out, cr, cc) && isStone(out[cr][cc])) {
        if (isBoulderStone(out, cr, cc)) return false;
        toPush.add(cr + ',' + cc);
        cr += dr;
        cc += dc;
      }
    }

    const pushed = Array.from(toPush)
      .map((k) => k.split(',').map((x) => parseInt(x, 10)))
      .sort((a, b) => {
        if (dr === 0) {
          return dc > 0 ? b[1] - a[1] : a[1] - b[1];
        } else {
          return dr > 0 ? b[0] - a[0] : a[0] - b[0];
        }
      });

    for (const [r, c] of pushed) {
      const nr = r + dr;
      const nc = c + dc;
      if (inBounds(out, nr, nc)) {
        out[nr][nc] = out[r][c];
      }
      out[r][c] = null;
    }

    for (const [r, c] of sorted) {
      const nr = r + dr;
      const nc = c + dc;
      if (inBounds(out, nr, nc)) {
        out[nr][nc] = board[r][c];
      }
    }

    return true;
  }

  if (dr === 0) {
    for (let r = 0; r < size; r++) {
      if (!processLine(r)) return { ok: false, outBoard: null };
    }
  } else {
    for (let c = 0; c < size; c++) {
      if (!processLine(c)) return { ok: false, outBoard: null };
    }
  }

  return { ok: true, outBoard: out };
}

function isBoardFull(board) {
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board.length; c++) {
      if (board[r][c] === null) return false;
    }
  }
  return true;
}

function boardSignature(board) {
  let s = '';
  for (let r = 0; r < board.length; r++) {
    const row = board[r];
    for (let c = 0; c < row.length; c++) {
      const cell = row[c];
      s += cell === 'black' ? 'B' : cell === 'white' ? 'W' : '.';
    }
    s += '|';
  }
  return s;
}

function seenPositionSetFromHistory(history) {
  const set = new Set();
  for (const st of history) {
    set.add(boardSignature(st.board));
  }
  return set;
}

function resultingBoardAfterMove(game, move) {
  if (!move || (move.type !== 'place' && move.type !== 'pass')) return null;
  if (move.type === 'pass') return game.board;
  const { row, col } = move;
  if (!inBounds(game.board, row, col) || !isEmpty(game.board[row][col])) return null;
  const player = game.currentPlayer;
  const trial = deepCloneBoard(game.board);
  trial[row][col] = player;
  const dirs = getLegalDirs(game, row, col);
  if (move.dir) {
    if (!dirs.includes(move.dir)) return null;
    const group = getMovingGroup(trial, row, col);
    const sim = simulateShift(trial, group, move.dir);
    if (!sim.ok) return null;
    return sim.outBoard;
  } else {
    if (dirs.length > 0) return null;
    return trial;
  }
}

export function getLegalDirs(game, row, col) {
  if (game.gameOver) return [];
  if (!inBounds(game.board, row, col)) return [];
  if (!isEmpty(game.board[row][col])) return [];
  const trial = deepCloneBoard(game.board);
  trial[row][col] = game.currentPlayer;
  const group = getMovingGroup(trial, row, col);
  if (group.size === 0) return [];
  const dirs = [];
  for (const d of dirList()) {
    const sim = simulateShift(trial, group, d);
    if (sim.ok) dirs.push(d);
  }
  return dirs;
}

export function getAllValidMoves(game) {
  const moves = [];
  if (game.gameOver) return moves;

  const size = game.board.length;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!isEmpty(game.board[r][c])) continue;
      const dirs = getLegalDirs(game, r, c);
      if (dirs.length === 0) {
        moves.push({ type: 'place', row: r, col: c });
      } else {
        for (const d of dirs) {
          moves.push({ type: 'place', row: r, col: c, dir: d });
        }
      }
    }
  }
  moves.push({ type: 'pass' });
  const seen = seenPositionSetFromHistory(game.history);
  const filtered = [];
  for (const m of moves) {
    if (m.type === 'pass') {
      filtered.push(m);
      continue;
    }
    const out = resultingBoardAfterMove(game, m);
    if (!out) continue;
    if (seen.has(boardSignature(out))) continue;
    filtered.push(m);
  }
  return filtered;
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
  if (!inBounds(game.board, row, col) || !isEmpty(game.board[row][col])) return game;

  const player = game.currentPlayer;
  const trial = deepCloneBoard(game.board);
  trial[row][col] = player;

  const dirs = getLegalDirs(game, row, col);
  if (move.dir) {
    if (!dirs.includes(move.dir)) return game;
  } else {
    if (dirs.length > 0) return game;
  }

  let newBoard = trial;
  if (move.dir) {
    const group = getMovingGroup(trial, row, col);
    const sim = simulateShift(trial, group, move.dir);
    if (!sim.ok) return game;
    newBoard = sim.outBoard;
  }

  const seen = seenPositionSetFromHistory(game.history);
  if (seen.has(boardSignature(newBoard))) {
    return game;
  }

  const newGame = {
    board: newBoard,
    currentPlayer: other(game.currentPlayer),
    history: [...game.history, state],
    gameOver: false,
    gameName: game.gameName,
  };

  if (isBoardFull(newBoard) || onlySuicidalPlacementsRemain(newGame)) {
    const { winner } = scoreFinalPosition(newBoard);
    newGame.gameOver = winner || 'draw';
  }

  return Object.freeze(newGame);
}

function onlySuicidalPlacementsRemain(game) {
  const moves = getAllValidMoves(game);
  const placeMoves = moves.filter((m) => m.type === 'place');
  if (placeMoves.length === 0) return false;
  for (const m of placeMoves) {
    if (!isSuicidalPlacement(game, m)) return false;
  }
  return true;
}

function isSuicidalPlacement(game, move) {
  if (move.type !== 'place') return false;
  if (!move.dir) return false;
  const [dr, dc] = DIRS[move.dir];
  const nr = move.row + dr;
  const nc = move.col + dc;
  return !inBounds(game.board, nr, nc);
}

function scoreFinalPosition(board) {
  let black = 0;
  let white = 0;
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board.length; c++) {
      if (board[r][c] === 'black') black++;
      else if (board[r][c] === 'white') white++;
    }
  }
  let winner = null;
  if (black > white) winner = 'black';
  else if (white > black) winner = 'white';
  return { blackScore: black, whiteScore: white, winner };
}

export function boardToString(board) {
  const size = board.length;
  const files = 'ABCDEFG'.slice(0, size).split('');
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
  // Player: white
  // Previous Move: A5U
  // Game Status: ongoing
  // Board:
  //   A B C D E F G
  // 7 W . . W W . .
  // 6 B . . W W . .
  // 5 . B B B . . W
  // 4 . B B B B B .
  // 3 . . W . W B B
  // 2 . . . . . W B
  // 1 . . . . . W B
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
Shove (7x7) rules:
- The board starts empty. Black moves first; players alternate.
- A move places a single stone of your color on any empty intersection, then choses a legal direction to shove the stone. Shoving makes the stone and any connected group of stones of the same color move one cell in the chosen direction, pushing other stones out of the way.
- A connected group of stones is formed by stones of the same color connected orthogonally (up/down/left/right).
- Pushing cascades: if a destination is occupied, that stone is pushed one cell further in the same direction, and so on. Stones pushed off the board fall into the gutter and are removed.
- Boulders (a 2x2 same-color grouping of stones) are not counted as part of a connected group. If any shove would need to move a boulder, that shove direction is illegal. A stone placed with no legal shove direction is placed without shoving.
- Instead of moving, a player may pass their turn.  
- Two consecutive passes end the game. The game also ends if the board is full, or if the only remaining legal moves are placing stones and then immediately shoving them into the gutter.
- Ko/superko: You may not play a move that recreates any previous board position.
- Scoring: the player with the greatest number of stones on the board wins. Draws are possible.

When viewing a text representation of the board state, B = black, W = white, and . = empty.
`;
}

export function moveToMoveStr(move) {
  if (!move) return 'N/A';
  if (move.type === 'pass') return 'PASS';
  if (move.type === 'place') {
    const files = 'ABCDEFG';
    const file = files[move.col];
    const rank = 7 - move.row; // top row is 7
    const d = move.dir ? move.dir.toUpperCase() : '';
    return `${file}${rank}${d}`;
  }
  return 'N/A';
}

export function parseMoveStr(moveStr, validMoves) {
  if (!moveStr) return null;
  const s = moveStr.trim();
  if (s.toUpperCase() === 'PASS') return validMoves.find((m) => m.type === 'pass') || null;
  // Pattern like 'E5U' or 'e5' (no dir allowed only if valid)
  const m = /^([A-Ga-g])([1-7])([UDLRudlr])?$/.exec(s);
  if (!m) return null;
  const col = 'ABCDEFG'.indexOf(m[1].toUpperCase());
  const rank = parseInt(m[2], 10);
  const row = 7 - rank;
  const dir = m[3] ? m[3].toUpperCase() : null;

  const key = (mv) =>
    mv.type === 'place' ? `${mv.row},${mv.col},${mv.dir ? mv.dir : ''}` : mv.type;
  const targetKey = `${row},${col},${dir ? dir : ''}`;
  return validMoves.find((mv) => key(mv) === targetKey) || null;
}

export function llmPrompt(game) {
  const NUM_PREVIOUS_MOVES = 50;
  const validMoves = getAllValidMoves(game);
  const prevCount = Math.min(NUM_PREVIOUS_MOVES, Math.max(0, game.history.length - 1));
  return `
You are playing Shove (7x7). Analyze extremely carefully and choose the best move. You are playing ${game.currentPlayer}.

Notation:
- Use coordinates like E5U (file A..G, rank 7..1, then a direction to shove U/D/L/R) or PASS.
- Files are A..G left-to-right; ranks are 7..1 top-to-bottom.

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

Now choose your move. Verify it is legal. The last line of your response should be just the move (e.g., E5U or PASS).
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
