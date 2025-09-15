import { initialRules as chessRules } from '$lib/board-games/Chess';

export function createGame() {
  const board = createInitialBoard();
  const currentPlayer = 'white';
  const state = {
    board: board.map((row) => [...row]),
    currentPlayer: currentPlayer,
    halfMoveCount: 0,
    move: null,
  };

  return Object.freeze({
    board,
    currentPlayer,
    history: [state],
    selectedPiece: null,
    gameOver: false,
    halfMoveCount: 0,
    gameName: 'fantastical-chess',
  });
}

function createInitialBoard() {
  const board = Array(8).fill(null);

  // White pieces lowercase, black pieces uppercase
  // Lame King (K/k)
  // Wizard (W/w)
  // Bowman (B/b)
  // Ninja (N/n)
  // Alchemist (A/a)
  // Catapult (C/c)
  // Fish (F/f)
  // Shark (S/s)
  board[0] = ['W', 'N', 'K', 'A', 'W', 'A', 'N', 'W'];
  board[1] = [null, 'B', 'B', 'B', 'B', 'B', 'B', null];
  board[2] = ['f', null, null, null, null, null, null, 'f'];
  board[3] = ['f', null, null, 'C', 'C', null, null, 'f'];
  board[4] = ['F', null, null, 'c', 'c', null, null, 'F'];
  board[5] = ['F', null, null, null, null, null, null, 'F'];
  board[6] = [null, 'b', 'b', 'b', 'b', 'b', 'b', null];
  board[7] = ['w', 'n', 'k', 'a', 'w', 'a', 'n', 'w'];

  return board;
}

export function rankFileNotation(row, col) {
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  return `${files[col]}${ranks[row]}`;
}

export function moveToMoveStr(move) {
  // Using long algebraic notation
  // e.g. Aa5a6
  // For captures with no moves: Ba5xa6
  // For double captures with no moves: Ba5xa6xa7
  // For fish merging: Fc4d4
  if (!move) {
    return 'N/A';
  } else if (move.type === 'double_capture') {
    return `${move.fromPiece.toUpperCase()}${rankFileNotation(move.fromRow, move.fromCol)}x${rankFileNotation(move.toRow, move.toCol)}x${rankFileNotation(move.secondCapture.row, move.secondCapture.col)}`;
  } else if (move.type === 'capture_no_move') {
    return `${move.fromPiece.toUpperCase()}${rankFileNotation(move.fromRow, move.fromCol)}x${rankFileNotation(move.toRow, move.toCol)}`;
  } else if (move.type === 'move') {
    return `${move.fromPiece.toUpperCase()}${rankFileNotation(move.fromRow, move.fromCol)}${move.capture ? 'x' : ''}${rankFileNotation(move.toRow, move.toCol)}`;
  } else if (move.type === 'merge_shark') {
    return `${move.fromPiece.toUpperCase()}${rankFileNotation(move.fromRow, move.fromCol)}${rankFileNotation(move.toRow, move.toCol)}M`;
  } else if (move.type === 'swap') {
    return `${move.fromPiece.toUpperCase()}${rankFileNotation(move.fromRow, move.fromCol)}${rankFileNotation(move.toRow, move.toCol)}S`;
  }
}

export function parseMoveStr(moveStr, validMoves) {
  // Using long algebraic notation
  const move = validMoves.find((move) => moveToMoveStr(move) === moveStr);
  return move;
}

export function boardToString(board) {
  return `
  a b c d e f g h
8 ${board[0].join(' ')}
7 ${board[1].join(' ')}
6 ${board[2].join(' ')}
5 ${board[3].join(' ')}
4 ${board[4].join(' ')}
3 ${board[5].join(' ')}
2 ${board[6].join(' ')}
1 ${board[7].join(' ')}
`;
}

export function gameStateToString(game) {
  const latestState = game.history[game.history.length - 1];
  const latestMove = latestState.move;
  // Return game state in the following format:
  //
  // Player: black
  // Previous Move: Bd2d3
  // Game Status: ongoing
  // Board:
  // a b c d e f g h
  // 8 w n k a w a n w
  // 7 . b b b b b b .
  // 6 F . . . . . . F
  // 5 F . . c c . . F
  // 4 f . . C C . . f
  // 3 f . B . . . . f
  // 2 . B . B B B B .
  // 1 W N K A W A N W
  //
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
The rules of Fantastical Chess are based on the regular rules of chess. Here are the rules of chess:
${chessRules()}
The rules of Fantastical Chess are the same as chess except:
- No piece can be captured en passant.
- Castling does not exist (there are no Rooks in Fantastical Chess).
- Threefold repetition rule and check/checkmate/stalemate rules are still in effect.
- The 50 move rule is still in effect, but does not count Pawn moves, as there are no Pawns in Fantastical Chess.
- Instead of the regular chess pieces, there are new pieces with new rules.

Piece rules:
- Lame King (K/k): Same as chess king but cannot move at all. Can still be in check/checkmate.
- Wizard (W/w): Can move diagonally up to 2 squares, ignoring obstructing pieces. OR can swap places with your own king (special ability).
- Bowman (B/b): Moves 1 square orthogonally (up/down/left/right). Can capture pieces 1 or 2 squares directly forward, or both simultaneously. Does not ever move when capturing. Cannot capture 2 squares forward if a friendly piece is 1 square forward.
- Ninja (N/n): Moves diagonally any distance, then horizontally (left/right) any distance (a two-part move). Cannot move through pieces at any point during movement. Special capture rules: can only capture pieces by moving backward or diagonally backward into the piece (attacking from behind). Backward for a piece is toward the 1 rank if that piece is white, or toward the 8 rank if that piece is black. For example, a white Ninja on b7 could capture a black Bowman on a6.
- Alchemist (A/a): Moves and captures 1 or 2 squares orthogonally (up/down/left/right) in any direction. When captured, destroys all pieces within 1 square (except for Lame Kings), but does not destroy the capturing piece (unless the capturing piece was a Bowman 1 square away).
- Catapult (C/c): Moves exactly 1 square orthogonally (cannot capture while moving). Can capture any piece 7+ squares away (measured by king moves, that is diagonal counts as 1 square), ignoring obstructions. Does not move when capturing. Since diagonal counts as 1 square not 2, this means a Catapult can only ever capture pieces if they are very far away.
- Fish (F/f): Moves horizontally (left/right) 1 square. Can capture when moving. Can move onto a friendly Fish to remove both Fish and create a Shark.
- Shark (S/s): Moves horizontally or vertically any distance. Is not obstructed by other pieces.

Important:
- The only pieces that can move through other pieces are the Wizard, and the Shark.

Special move notations (using long algebraic notation):
- Normal moves (for example, Aa5a6 indicates an Alchemist moving from a5 to a6).
- Captures (for example, aa5xa6 indicates an Alchemist moving from a5 to a6 and capturing a piece).
- Captures without moves (for example, Cb1xd8 indicates a Catapult on b1 capturing a piece from across the board on d8 without moving)
- Multiple captures without moves (for example, ba5xa6xa7 indicates a Bowman on a5 capturing a piece on a6 and another piece on a7 in one move. The Bowman does not move.)
- Merges (for example, Fc4d4M indicates a Fish on c4 merging with a Fish on d4 to create a Shark on d4.)
- Swaps (for example, Wh1c1S indicates a Wizard on h1 swapping positions with a Lame King on c1.)

When viewing a text representation of the board, lowercase = White pieces, Uppercase = black pieces.
`;
}

export function llmPrompt(game) {
  const NUM_PREVIOUS_MOVES = 50;
  const validMoves = getAllValidMoves(game);
  return `
You are playing a chess variant called Fantastical Chess with custom pieces and rules. Analyze each position extremely carefully, and make the best possible move. You are playing ${game.currentPlayer}.

The rules of the game are as follows:
${rules()}

Here are the past ${Math.min(NUM_PREVIOUS_MOVES, game.history.length - 1)} board states/moves (if any):
${game.history
  .slice(-Math.min(NUM_PREVIOUS_MOVES, game.history.length - 1))
  .map((state) => `${boardToString(state.board)}\n${moveToMoveStr(state.move)}`)
  .join('\n')}

This is the current board state:
${gameStateToString(game)}

The following moves are currently legal:
${validMoves.map((move) => moveToMoveStr(move)).join('\n')}

Now choose your move. Always verify your move is legal according to the piece rules before committing to it. Choose the best move possible to win the game. Your response format can be whatever you want, but the last line of your response should simply be your move in long algebraic notation, without any other content.
`;
}

export function getPrevMoveSquares(game) {
  const prevState = game.history[game.history.length - 1];
  const prevMoveSquares = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const current = game.board[r][c];
      const prev = prevState.board[r][c];
      if (current !== prev) prevMoveSquares.push({ row: r, col: c });
    }
  }
  return prevMoveSquares;
}

export function getValidMoves(game, row, col) {
  const piece = game.board[row][col];
  if (!piece) return [];

  const color = getPieceColor(piece);
  const moves = getMoves(game, row, col);
  const valid = moves.filter((move) => !wouldBeInCheck(game, move, color));

  return valid;
}

export function getAllValidMoves(game) {
  const currentColor = game.currentPlayer;
  const moves = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = game.board[r][c];
      if (piece && getPieceColor(piece) === currentColor) {
        const pieceMoves = getValidMoves(game, r, c);
        for (const mv of pieceMoves) {
          moves.push(mv);
        }
      }
    }
  }

  return moves;
}

function getMoves(game, row, col) {
  const piece = game.board[row][col];
  if (!piece) return [];

  const pieceType = piece.toLowerCase();
  const color = getPieceColor(piece);
  const moves = [];

  switch (pieceType) {
    case 'k':
      // No moves for Lame King
      break;
    case 'w':
      moves.push(...getWizardMoves(game, row, col, color));
      break;
    case 'b':
      moves.push(...getBowmanMoves(game, row, col, color));
      break;
    case 'n':
      moves.push(...getNinjaMoves(game, row, col, color));
      break;
    case 'a':
      moves.push(...getAlchemistMoves(game, row, col, color));
      break;
    case 'c':
      moves.push(...getCatapultMoves(game, row, col, color));
      break;
    case 'f':
      moves.push(...getFishMoves(game, row, col, color));
      break;
    case 's':
      moves.push(...getSharkMoves(game, row, col, color));
      break;
  }

  return moves;
}

function getWizardMoves(game, row, col, color) {
  const moves = [];
  const fromPiece = game.board[row][col];

  // Can move diagonally up to 2 squares
  const directions = [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ];
  for (const [dr, dc] of directions) {
    for (let dist = 1; dist <= 2; dist++) {
      const newRow = row + dr * dist;
      const newCol = col + dc * dist;
      if (!isValidSquare(newRow, newCol)) break;

      const target = game.board[newRow][newCol];
      if (!target || getPieceColor(target) !== color) {
        const capture =
          target && getPieceColor(target) !== color
            ? { row: newRow, col: newCol, piece: target }
            : null;
        moves.push({
          fromPiece,
          toPiece: fromPiece,
          fromRow: row,
          fromCol: col,
          toRow: newRow,
          toCol: newCol,
          capture,
          secondCapture: null,
          type: 'move',
          isCheck: false,
          isCheckmate: false,
        });
      }
    }
  }

  // Can swap with friendly king
  const kingPos = findKing(game, color);
  if (kingPos) {
    moves.push({
      fromPiece,
      toPiece: fromPiece,
      fromRow: row,
      fromCol: col,
      toRow: kingPos.row,
      toCol: kingPos.col,
      capture: null,
      secondCapture: null,
      type: 'swap',
      isCheck: false,
      isCheckmate: false,
    });
  }

  return moves;
}

function getBowmanMoves(game, row, col, color) {
  const moves = [];
  const fromPiece = game.board[row][col];

  // Can move 1 square in any orthogonal direction, but cannot capture
  const directions = [
    [-1, 0],
    [0, -1],
    [0, 1],
    [1, 0],
  ];

  for (const [dr, dc] of directions) {
    const newRow = row + dr;
    const newCol = col + dc;
    if (isValidSquare(newRow, newCol)) {
      const target = game.board[newRow][newCol];
      if (!target) {
        moves.push({
          fromPiece,
          toPiece: fromPiece,
          fromRow: row,
          fromCol: col,
          toRow: newRow,
          toCol: newCol,
          capture: null,
          secondCapture: null,
          type: 'move',
          isCheck: false,
          isCheckmate: false,
        });
      }
    }
  }

  // Can capture one and/or two squares forward without moving
  const forwardDir = color === 'white' ? -1 : 1;

  // Check 1 square forward
  const oneForward = game.board[row + forwardDir]?.[col];
  const canCapture1 = oneForward && getPieceColor(oneForward) !== color;

  // Check 2 squares forward
  const twoForward = game.board[row + forwardDir * 2]?.[col];
  const canCapture2 =
    twoForward &&
    getPieceColor(twoForward) !== color &&
    (!oneForward || getPieceColor(oneForward) !== color);

  if (canCapture1 && !canCapture2) {
    moves.push({
      fromPiece,
      toPiece: fromPiece,
      fromRow: row,
      fromCol: col,
      toRow: row + forwardDir,
      toCol: col,
      capture: { row: row + forwardDir, col: col, piece: oneForward },
      secondCapture: null,
      type: 'capture_no_move',
      isCheck: false,
      isCheckmate: false,
    });
  }
  if (canCapture2 && !canCapture1) {
    moves.push({
      fromPiece,
      toPiece: fromPiece,
      fromRow: row,
      fromCol: col,
      toRow: row + forwardDir * 2,
      toCol: col,
      capture: { row: row + forwardDir * 2, col: col, piece: twoForward },
      secondCapture: null,
      type: 'capture_no_move',
      isCheck: false,
      isCheckmate: false,
    });
  }
  if (canCapture1 && canCapture2) {
    moves.push({
      fromPiece,
      toPiece: fromPiece,
      fromRow: row,
      fromCol: col,
      toRow: row + forwardDir,
      toCol: col,
      capture: { row: row + forwardDir, col: col, piece: oneForward },
      secondCapture: { row: row + forwardDir * 2, col: col, piece: twoForward },
      type: 'double_capture',
      isCheck: false,
      isCheckmate: false,
    });
  }

  return moves;
}

function getNinjaMoves(game, row, col, color) {
  const moves = [];
  const fromPiece = game.board[row][col];

  // Non-capturing moves: diagonal any distance (including 0), then left/right any distance (including 0)
  const diagDirs = [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ];

  for (const [dr, dc] of diagDirs) {
    // Try each diagonal distance
    for (let diagDist = 0; diagDist < 8; diagDist++) {
      const midRow = row + dr * diagDist;
      const midCol = col + dc * diagDist;
      if (!isValidSquare(midRow, midCol)) break;

      // Check if diagonal path is blocked
      if (diagDist > 0 && game.board[midRow][midCol]) {
        break; // Path is blocked, can't go further in this diagonal direction
      }

      // From the diagonal position, try moving left/right (including 0 distance)
      for (const horizDir of [-1, 0, 1]) {
        for (let horizDist = horizDir === 0 ? 0 : 1; horizDist < 8; horizDist++) {
          const finalRow = midRow;
          const finalCol = midCol + horizDir * horizDist;
          if (!isValidSquare(finalRow, finalCol)) break;

          // Check if horizontal path is blocked
          if (horizDist > 0 && game.board[finalRow][finalCol]) {
            break; // Path is blocked, can't go further in this horizontal direction
          }

          const target = game.board[finalRow][finalCol];
          if (!target) {
            moves.push({
              fromPiece,
              toPiece: fromPiece,
              fromRow: row,
              fromCol: col,
              toRow: finalRow,
              toCol: finalCol,
              capture: null,
              secondCapture: null,
              type: 'move',
              isCheck: false,
              isCheckmate: false,
            });
          }

          // If horizDir is 0, we only need distance 0, so break
          if (horizDir === 0) break;
        }
      }
    }
  }

  // Capturing moves: backward or diagonally backward into enemy pieces
  const backwardDirs =
    color === 'white'
      ? [
          [1, 0],
          [1, -1],
          [1, 1],
        ]
      : [
          [-1, 0],
          [-1, -1],
          [-1, 1],
        ];

  for (const [dr, dc] of backwardDirs) {
    const targetRow = row + dr;
    const targetCol = col + dc;
    if (!isValidSquare(targetRow, targetCol)) continue; // Fixed: should be continue, not break

    const target = game.board[targetRow][targetCol];
    if (target && getPieceColor(target) !== color) {
      moves.push({
        fromPiece,
        toPiece: fromPiece,
        fromRow: row,
        fromCol: col,
        toRow: targetRow,
        toCol: targetCol,
        capture: { row: targetRow, col: targetCol, piece: target },
        secondCapture: null,
        type: 'backward_capture',
        isCheck: false,
        isCheckmate: false,
      });
    }
  }

  return moves;
}

function getAlchemistMoves(game, row, col, color) {
  const moves = [];
  const fromPiece = game.board[row][col];

  // Can move and capture 1-2 squares in any orthogonal direction
  const directions = [
    [-1, 0],
    [0, -1],
    [0, 1],
    [1, 0],
  ];

  for (const [dr, dc] of directions) {
    const oneRow = row + dr;
    const oneCol = col + dc;
    if (isValidSquare(oneRow, oneCol)) {
      const target1 = game.board[oneRow][oneCol];
      if (!target1) {
        moves.push({
          fromPiece,
          toPiece: fromPiece,
          fromRow: row,
          fromCol: col,
          toRow: oneRow,
          toCol: oneCol,
          capture: null,
          secondCapture: null,
          type: 'move',
          isCheck: false,
          isCheckmate: false,
        });
      } else if (getPieceColor(target1) !== color) {
        moves.push({
          fromPiece,
          toPiece: fromPiece,
          fromRow: row,
          fromCol: col,
          toRow: oneRow,
          toCol: oneCol,
          capture: { row: oneRow, col: oneCol, piece: target1 },
          secondCapture: null,
          type: 'move',
          isCheck: false,
          isCheckmate: false,
        });
      }

      // Try 2 squares (only if 1 square is not blocked)
      if (!target1) {
        const twoRow = row + dr * 2;
        const twoCol = col + dc * 2;
        if (isValidSquare(twoRow, twoCol)) {
          const target2 = game.board[twoRow][twoCol];
          if (!target2) {
            moves.push({
              fromPiece,
              toPiece: fromPiece,
              fromRow: row,
              fromCol: col,
              toRow: twoRow,
              toCol: twoCol,
              capture: null,
              secondCapture: null,
              type: 'move',
              isCheck: false,
              isCheckmate: false,
            });
          } else if (getPieceColor(target2) !== color) {
            moves.push({
              fromPiece,
              toPiece: fromPiece,
              fromRow: row,
              fromCol: col,
              toRow: twoRow,
              toCol: twoCol,
              capture: { row: twoRow, col: twoCol, piece: target2 },
              secondCapture: null,
              type: 'move',
              isCheck: false,
              isCheckmate: false,
            });
          }
        }
      }
    }
  }

  return moves;
}

function getCatapultMoves(game, row, col, color) {
  const moves = [];
  const fromPiece = game.board[row][col];

  // Can move 1 square up/left/right/down
  const directions = [
    [-1, 0], // up
    [0, -1], // left
    [0, 1], // right
    [1, 0], // down
  ];

  for (const [dr, dc] of directions) {
    const newRow = row + dr;
    const newCol = col + dc;

    if (isValidSquare(newRow, newCol)) {
      const target = game.board[newRow][newCol];

      if (!target) {
        moves.push({
          fromPiece,
          toPiece: fromPiece,
          fromRow: row,
          fromCol: col,
          toRow: newRow,
          toCol: newCol,
          capture: null,
          secondCapture: null,
          type: 'move',
          isCheck: false,
          isCheckmate: false,
        });
      }
    }
  }

  // Can capture 6+ squares away, without moving. These ignore obstruction
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const dist = Math.max(Math.abs(r - row), Math.abs(c - col));
      if (dist >= 7) {
        const target = game.board[r][c];
        if (target && getPieceColor(target) !== color) {
          moves.push({
            fromPiece,
            toPiece: fromPiece,
            fromRow: row,
            fromCol: col,
            toRow: r,
            toCol: c,
            capture: { row: r, col: c, piece: target },
            secondCapture: null,
            type: 'capture_no_move',
            isCheck: false,
            isCheckmate: false,
          });
        }
      }
    }
  }

  return moves;
}

function getFishMoves(game, row, col, color) {
  const moves = [];
  const fromPiece = game.board[row][col];

  // Can move left/right one square only
  const targets = [
    [row, col - 1],
    [row, col + 1],
  ];
  for (const [newRow, newCol] of targets) {
    if (isValidSquare(newRow, newCol)) {
      const target = game.board[newRow][newCol];
      if (!target || getPieceColor(target) !== color) {
        const capture =
          target && getPieceColor(target) !== color
            ? { row: newRow, col: newCol, piece: target }
            : null;
        moves.push({
          fromPiece,
          toPiece: fromPiece,
          fromRow: row,
          fromCol: col,
          toRow: newRow,
          toCol: newCol,
          capture,
          secondCapture: null,
          type: 'move',
          isCheck: false,
          isCheckmate: false,
        });
      } else if (target.toLowerCase() === 'f') {
        // Can merge with same-color fish
        moves.push({
          fromPiece,
          toPiece: color === 'white' ? 's' : 'S',
          fromRow: row,
          fromCol: col,
          toRow: newRow,
          toCol: newCol,
          capture: null,
          secondCapture: null,
          type: 'merge_shark',
          isCheck: false,
          isCheckmate: false,
        });
      }
    }
  }

  return moves;
}

function getSharkMoves(game, row, col, color) {
  const moves = [];
  const fromPiece = game.board[row][col];

  // Can move orthogonally any distance. These ignore obstruction.
  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  for (const [dr, dc] of dirs) {
    for (let dist = 1; dist < 8; dist++) {
      const newRow = row + dr * dist;
      const newCol = col + dc * dist;
      if (!isValidSquare(newRow, newCol)) break;

      const target = game.board[newRow][newCol];
      if (!target || getPieceColor(target) !== color) {
        const capture =
          target && getPieceColor(target) !== color
            ? { row: newRow, col: newCol, piece: target }
            : null;
        moves.push({
          fromPiece,
          toPiece: fromPiece,
          fromRow: row,
          fromCol: col,
          toRow: newRow,
          toCol: newCol,
          capture,
          secondCapture: null,
          type: 'move',
          isCheck: false,
          isCheckmate: false,
        });
      }
    }
  }

  return moves;
}

function wouldBeInCheck(game, move, color) {
  const newGame = makeMove(game, move);
  return isInCheck(newGame, color);
}

function isInCheck(game, color) {
  const kingPos = findKing(game, color);
  if (!kingPos) return false;

  const opponentColor = color === 'white' ? 'black' : 'white';

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = game.board[row][col];
      if (piece && getPieceColor(piece) === opponentColor) {
        const moves = getMoves(game, row, col);
        if (
          moves.some(
            (m) =>
              (m.toRow === kingPos.row && m.toCol === kingPos.col) ||
              (m.secondCapture &&
                m.secondCapture.row === kingPos.row &&
                m.secondCapture.col === kingPos.col)
          )
        ) {
          return true;
        }
      }
    }
  }

  return false;
}

function findKing(game, color) {
  const kingPiece = color === 'white' ? 'k' : 'K';
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (game.board[row][col] === kingPiece) {
        return { row, col };
      }
    }
  }
  return null;
}

export function makeMove(game, move) {
  const { fromRow, fromCol, toRow, toCol, type } = move;
  const piece = game.board[fromRow][fromCol];
  const color = getPieceColor(piece);

  // Create new board copy
  const newBoard = game.board.map((row) => [...row]);

  const state = {
    board: game.board.map((row) => [...row]),
    currentPlayer: game.currentPlayer,
    halfMoveCount: game.halfMoveCount,
    move: move ? { ...move } : null,
  };

  const captures = [];
  const capturedAlchemists = [];

  switch (type) {
    case 'swap': {
      const target = newBoard[toRow][toCol];
      newBoard[toRow][toCol] = piece;
      newBoard[fromRow][fromCol] = target;
      break;
    }
    case 'capture_no_move': {
      const target = newBoard[toRow][toCol];
      captures.push(target);
      if (target !== null && target.toLowerCase() === 'a')
        capturedAlchemists.push({ row: toRow, col: toCol });
      newBoard[toRow][toCol] = null;
      break;
    }
    case 'double_capture': {
      const target = newBoard[toRow][toCol];
      const second = move.secondCapture
        ? newBoard[move.secondCapture.row][move.secondCapture.col]
        : null;
      captures.push(target);
      if (second !== null) captures.push(second);
      if (target !== null && target.toLowerCase() === 'a')
        capturedAlchemists.push({ row: toRow, col: toCol });
      if (move.secondCapture && second !== null && second.toLowerCase() === 'a')
        capturedAlchemists.push({ row: move.secondCapture.row, col: move.secondCapture.col });
      newBoard[toRow][toCol] = null;
      if (move.secondCapture) newBoard[move.secondCapture.row][move.secondCapture.col] = null;
      break;
    }
    case 'merge_shark': {
      newBoard[toRow][toCol] = color === 'white' ? 's' : 'S';
      newBoard[fromRow][fromCol] = null;
      break;
    }
    default: {
      const target = newBoard[toRow][toCol];
      captures.push(target);
      if (target !== null && target.toLowerCase() === 'a')
        capturedAlchemists.push({ row: toRow, col: toCol });
      newBoard[toRow][toCol] = piece;
      newBoard[fromRow][fromCol] = null;
    }
  }

  let newHalfMoveCount;
  if (captures.some((piece) => piece !== null)) {
    newHalfMoveCount = 0;
  } else {
    newHalfMoveCount = game.halfMoveCount + 1;
  }

  while (capturedAlchemists.length > 0) {
    const capturedAlchemist = capturedAlchemists.shift();
    const newCapturedAlchemists = alchemistExplosion(newBoard, capturedAlchemist);
    capturedAlchemists.push(...newCapturedAlchemists);
  }

  return Object.freeze({
    board: newBoard,
    currentPlayer: game.currentPlayer === 'white' ? 'black' : 'white',
    history: [...game.history, state],
    selectedPiece: null,
    gameOver: false,
    halfMoveCount: newHalfMoveCount,
    gameName: game.gameName,
  });
}

function alchemistExplosion(board, { row, col }) {
  const newDestroyedAlchemists = [];
  // Destroy adjacent pieces (except kings and the capturing piece itself)
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (isValidSquare(r, c)) {
        const p = board[r][c];
        if (p && p.toLowerCase() !== 'k') {
          if (p.toLowerCase() === 'a') {
            newDestroyedAlchemists.push({ row: r, col: c });
          }
          board[r][c] = null;
        }
      }
    }
  }

  return newDestroyedAlchemists;
}

export function getPieceColor(piece) {
  if (!piece) return null;
  return piece === piece.toLowerCase() ? 'white' : 'black';
}

function isValidSquare(row, col) {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

export function getGameStatus(game) {
  const inCheck = isInCheck(game, game.currentPlayer);
  const hasLegalMoves = hasLegalMovesForColor(game, game.currentPlayer);
  const isRepetition = isThreefoldRepetition(game);

  if (game.halfMoveCount >= 100) {
    return 'fifty-move-draw';
  }
  if (!hasLegalMoves) {
    if (inCheck) {
      return 'checkmate';
    } else {
      return 'stalemate';
    }
  }
  if (isRepetition) {
    return 'draw';
  }
  if (inCheck) {
    return 'check';
  }
  return 'ongoing';
}

export function gameIsOver(game) {
  const status = getGameStatus(game);
  return status !== 'ongoing' && status !== 'check';
}

export function gameOverText(game) {
  const status = getGameStatus(game);
  return status === 'checkmate'
    ? `Checkmate (${game.currentPlayer === 'white' ? 'Black' : 'White'} wins!)`
    : status === 'stalemate'
      ? 'Stalemate'
      : status === 'draw' || status === 'fifty-move-draw'
        ? 'Draw'
        : '';
}

function hasLegalMovesForColor(game, color) {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = game.board[row][col];
      if (piece && getPieceColor(piece) === color) {
        const moves = getValidMoves(game, row, col);
        if (moves.length > 0) return true;
      }
    }
  }
  return false;
}

function isThreefoldRepetition(game) {
  const currentState = {
    board: game.board.map((row) => [...row]),
    currentPlayer: game.currentPlayer,
  };
  let count = 0;
  for (const historyState of game.history) {
    if (statesEqual(currentState, historyState)) count++;
    if (count >= 3) return true;
  }
  return false;
}

function statesEqual(state1, state2) {
  return boardsEqual(state1.board, state2.board) && state1.currentPlayer === state2.currentPlayer;
}

function boardsEqual(board1, board2) {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece1 = board1[row][col];
      const piece2 = board2[row][col];
      if (piece1 !== piece2) return false;
    }
  }
  return true;
}

export function undo(game) {
  if (game.history.length === 0) return game;

  const state = game.history[game.history.length - 1];
  return Object.freeze({
    board: state.board,
    currentPlayer: state.currentPlayer,
    history: game.history.slice(0, -1),
    selectedPiece: null,
    gameOver: false,
    halfMoveCount: state.halfMoveCount,
    gameName: game.gameName,
  });
}

export function reset() {
  return createGame();
}
