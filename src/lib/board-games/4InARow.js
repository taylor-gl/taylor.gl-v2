export function createGame() {
  const board = createInitialBoard();
  const currentPlayer = 'red';
  const state = {
    board: board.map((row) => [...row]),
    currentPlayer: currentPlayer,
    move: null,
  };

  return Object.freeze({
    board,
    currentPlayer,
    history: [state],
    gameOver: false,
    gameName: '4-in-a-row',
  });
}

export function boardToString(board) {
  let str = '0 1 2 3 4 5 6\n';
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 7; col++) {
      const cell = board[row][col];
      str += (cell === 'red' ? 'R' : cell === 'yellow' ? 'Y' : '.') + ' ';
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
  // Previous Move: 3
  // Game Status: ongoing
  // Board:
  // 0 1 2 3 4 5 6
  // . . . . . . .
  // . . . . . . .
  // . . . . . . .
  // . . . . . . .
  // . . . . . . .
  // . . . . . . .
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
- 4 in a Row (same rules as Connect 4) is a game where each player tries to build a row of four discs of their color, while preventing the other player from doing the same. The game takes place on a grid with 7 columns and 6 rows, and discs are inserted from the top.
- The first player to build a row of four discs horizontally, vertically, or diagonally wins. If the board is full and no player has won, the game is a draw.
- One player, Red, controls the red discs, and another, Yellow, controls the yellow discs. Each player plays one disc per turn until the game ends. Red moves first.
- On your turn, you may place a single disc of your color in any column. The disc will fall to the lowest available row in that column. If the column is full, you may not place a disc there. Play alternates until one player wins or the board is full.

When viewing a text representation of the board state, R = red, Y = yellow, and . = empty.
`;
}

export function llmPrompt(game) {
  const NUM_PREVIOUS_MOVES = 50;
  const validMoves = getAllValidMoves(game);
  const prevCount = Math.min(NUM_PREVIOUS_MOVES, Math.max(0, game.history.length - 1));
  return `
You are playing Connect 4. Analyze each position extremely carefully, and make the best possible move. You are playing ${game.currentPlayer}.

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
    board: game.board.map((row) => [...row]),
    currentPlayer: game.currentPlayer,
    move: col,
  };

  const newBoard = game.board.map((row) => [...row]);
  const row = getAvailableRow(newBoard, col);

  if (row === null) return game;

  newBoard[row][col] = game.currentPlayer;

  const winResult = checkWinner(newBoard, row, col, game.currentPlayer);
  const boardFull = isBoardFull(newBoard);

  return Object.freeze({
    board: newBoard,
    currentPlayer: game.currentPlayer === 'red' ? 'yellow' : 'red',
    history: [...game.history, state],
    gameOver: winResult === true ? game.currentPlayer : boardFull === true ? 'draw' : false,
    gameName: '4-in-a-row',
  });
}

function checkWinner(board, lastRow, lastCol, player) {
  const directions = [
    [
      [0, 1],
      [0, -1],
    ],
    [
      [1, 0],
      [-1, 0],
    ],
    [
      [1, 1],
      [-1, -1],
    ],
    [
      [1, -1],
      [-1, 1],
    ],
  ];

  for (const direction of directions) {
    const cells = [[lastRow, lastCol]];
    let count = 1;

    for (const [dr, dc] of direction) {
      let r = lastRow + dr;
      let c = lastCol + dc;

      while (r >= 0 && r < 6 && c >= 0 && c < 7 && board[r][c] === player) {
        cells.push([r, c]);
        count++;
        r += dr;
        c += dc;
      }
    }

    if (count >= 4) {
      return true;
    }
  }

  return false;
}

export function getAllValidMoves(game) {
  const moves = [];
  for (let col = 0; col < 7; col++) {
    if (isValidMove(game, col)) {
      moves.push(col);
    }
  }
  return moves;
}

function isBoardFull(board) {
  return board.every((row) => row.every((cell) => cell !== null));
}

export function getGameStatus(game) {
  if (game.gameOver === 'red' || game.gameOver === 'yellow') {
    return game.gameOver;
  } else if (game.gameOver === 'draw') {
    return 'draw';
  } else {
    return 'ongoing';
  }
}

export function undo(game) {
  if (game.history.length === 0) return game;

  const state = game.history[game.history.length - 1];
  return Object.freeze({
    board: state.board,
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
