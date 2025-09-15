export function createGame() {
  const board = createInitialBoard();
  const currentPlayer = 'white';
  const state = {
    board: board.map((row) => [...row]),
    currentPlayer: currentPlayer,
    halfMoveCount: 0,
    move: null,
    castlingRights: {
      whiteKingside: true,
      whiteQueenside: true,
      blackKingside: true,
      blackQueenside: true,
    },
    enPassantTarget: null,
  };

  return Object.freeze({
    board,
    currentPlayer,
    history: [state],
    selectedPiece: null,
    gameOver: false,
    halfMoveCount: 0,
    castlingRights: {
      whiteKingside: true,
      whiteQueenside: true,
      blackKingside: true,
      blackQueenside: true,
    },
    enPassantTarget: null,
    gameName: 'regular-chess',
  });
}

function createInitialBoard() {
  const board = Array(8).fill(null);

  // White pieces lowercase, black pieces uppercase
  // King (K/k)
  // Queen (Q/q)
  // Rook (R/r)
  // Bishop (B/b)
  // Knight (N/n)
  // Pawn (P/p)
  board[0] = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
  board[1] = ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'];
  board[2] = [null, null, null, null, null, null, null, null];
  board[3] = [null, null, null, null, null, null, null, null];
  board[4] = [null, null, null, null, null, null, null, null];
  board[5] = [null, null, null, null, null, null, null, null];
  board[6] = ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'];
  board[7] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];

  return board;
}

export function rankFileNotation(row, col) {
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  return `${files[col]}${ranks[row]}`;
}

export function moveToMoveStr(move) {
  // Using long algebraic notation
  // e.g. Ra5a6
  // For pawn promotion: Pa5a6q
  // For castling: O-O or O-O-O
  if (!move) {
    return 'None';
  }
  if (move.type === 'move') {
    return `${move.fromPiece.toUpperCase()}${rankFileNotation(move.fromRow, move.fromCol)}${rankFileNotation(move.toRow, move.toCol)}`;
  } else if (move.type === 'castle_kingside') {
    return 'O-O';
  } else if (move.type === 'castle_queenside') {
    return 'O-O-O';
  } else if (move.type === 'en_passant') {
    return `${move.fromPiece.toUpperCase()}${rankFileNotation(move.fromRow, move.fromCol)}x${rankFileNotation(move.toRow, move.toCol)}`;
  } else if (move.type === 'pawn_double') {
    return `${move.fromPiece.toUpperCase()}${rankFileNotation(move.fromRow, move.fromCol)}${rankFileNotation(move.toRow, move.toCol)}`;
  } else if (move.type === 'promotion') {
    return `${move.fromPiece.toUpperCase()}${rankFileNotation(move.fromRow, move.fromCol)}${rankFileNotation(move.toRow, move.toCol)}q`;
  }
}

export function parseMoveStr(moveStr, validMoves) {
  // Using long algebraic notation
  const move = validMoves.find((move) => moveToMoveStr(move) === moveStr);
  return move;
}

export function boardToString(board) {
  return `  a b c d e f g h
8 ${board[0].map((p) => p || '.').join(' ')}
7 ${board[1].map((p) => p || '.').join(' ')}
6 ${board[2].map((p) => p || '.').join(' ')}
5 ${board[3].map((p) => p || '.').join(' ')}
4 ${board[4].map((p) => p || '.').join(' ')}
3 ${board[5].map((p) => p || '.').join(' ')}
2 ${board[6].map((p) => p || '.').join(' ')}
1 ${board[7].map((p) => p || '.').join(' ')}`;
}

export function gameStateToString(game) {
  const latestState = game.history[game.history.length - 1];
  const latestMove = latestState.move;
  // Return game state in the following format:
  //
  // Player: black
  // Previous Move: Nc1d3
  // Game Status: ongoing
  // Board:
  // a b c d e f g h
  // 8 r n b q k b n r
  // 7 p p p p p p p p
  // 6 . . . . . . . .
  // 5 . . . . . . . .
  // 4 . . . . . . . .
  // 3 . . N . . . . .
  // 2 P P P P P P P P
  // 1 R . B Q K B N R
  //

  return `Player: ${game.currentPlayer}
Previous Move: ${latestMove ? moveToMoveStr(latestMove) : 'None'}
Game Status: ${getGameStatus(game)}
Board:
${boardToString(game.board)}`;
}

export function initialRules() {
  return `
- Chess is a game that takes place on an 8x8 board. One player, White, controls the white pieces, and another, Black, controls the black pieces. Each player moves one piece per turn until the game ends. White moves first.
- Objective: Checkmate the opponent's King.
- Capture: You may move a piece into another piece on your turn to capture it. The captured piece is removed from the board.
- Threatened: A piece is threatened if it may be captured by the threatening piece next turn.
- Check: A player is in check if their King is threatened. A player cannot make moves that would leave their King in check.
- Checkmate: King is in check with no legal moves to escape.
- The game ends when one player is in checkmate. That player loses. The game may also end in stalemate if a player has no legal moves but the king is not in check. Stalemate is considered a draw. A draw may also occur if a board state is repeated for a third time, or if 50 turns (100 player moves) have passed without a Pawn being moved or a piece being captured.
`;
}

export function rules() {
  return `
${initialRules()}

Piece rules:
- King (K/k): 1 square in any direction.
- Rook: (R/r): Any distance orthogonally (up/down/left/right).
- Bishop (B/b): Any distance diagonally.
- Queen (Q/q): Combines rook + bishop movement.
- Knight (N/n): Can move 2 squares one orthogonal direction, then 1 square in a perpendicular direction, in an L-shape. Unlike other pieces, can jump over pieces.
- Pawn (P/p): One square forward (two on its first move). Cannot capture by moving forward. Instead, if doing so would capture a piece, the Pawn may move one square diagonally forward.

Special moves:
- Castling: If neither a player's King nor that player's Rook has yet been moved, and the King is not in check, and castling would not move the King through or into check, then the player may move the King 2 squares toward the Rook, and the Rook to the other side of the King, to the second square the King crossed.
- En passant: If the opponent's Pawn moves 2 squares landing beside your Pawn, you can capture it as if it had only moved 1 square.
- Promotion: If your Pawn reaches the end of the board, it immediately becomes a Queen. (This implementation of Chess is simplified to only allow Queen promotion, but other versions may allow promotions to other pieces.)

When viewing a text representation of the board state, lowercase = White pieces, Uppercase = black pieces.
`;
}

export function llmPrompt(game) {
  const NUM_PREVIOUS_MOVES = 50;
  const validMoves = getAllValidMoves(game);
  return `
You are playing chess. Analyze each position extremely carefully, and make the best possible move. You are playing ${game.currentPlayer}.

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
      moves.push(...getKingMoves(game, row, col, color));
      break;
    case 'q':
      moves.push(...getQueenMoves(game, row, col, color));
      break;
    case 'r':
      moves.push(...getRookMoves(game, row, col, color));
      break;
    case 'b':
      moves.push(...getBishopMoves(game, row, col, color));
      break;
    case 'n':
      moves.push(...getKnightMoves(game, row, col, color));
      break;
    case 'p':
      moves.push(...getPawnMoves(game, row, col, color));
      break;
  }

  return moves;
}

function getKingMoves(game, row, col, color) {
  const moves = [];
  const fromPiece = game.board[row][col];

  // Regular king moves - 1 square in any direction
  const directions = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];

  for (const [dr, dc] of directions) {
    const newRow = row + dr;
    const newCol = col + dc;
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
      }
    }
  }

  // Castling
  if (color === 'white' && row === 7 && col === 4) {
    // White kingside castling
    if (
      game.castlingRights.whiteKingside &&
      !game.board[7][5] &&
      !game.board[7][6] &&
      game.board[7][7] === 'r'
    ) {
      if (
        !isSquareAttacked(game, 7, 4, 'black') &&
        !isSquareAttacked(game, 7, 5, 'black') &&
        !isSquareAttacked(game, 7, 6, 'black')
      ) {
        moves.push({
          fromPiece,
          toPiece: fromPiece,
          fromRow: row,
          fromCol: col,
          toRow: 7,
          toCol: 6,
          capture: null,
          secondCapture: null,
          type: 'castle_kingside',
          isCheck: false,
          isCheckmate: false,
        });
      }
    }
    // White queenside castling
    if (
      game.castlingRights.whiteQueenside &&
      !game.board[7][3] &&
      !game.board[7][2] &&
      !game.board[7][1] &&
      game.board[7][0] === 'r'
    ) {
      if (
        !isSquareAttacked(game, 7, 4, 'black') &&
        !isSquareAttacked(game, 7, 3, 'black') &&
        !isSquareAttacked(game, 7, 2, 'black')
      ) {
        moves.push({
          fromPiece,
          toPiece: fromPiece,
          fromRow: row,
          fromCol: col,
          toRow: 7,
          toCol: 2,
          capture: null,
          secondCapture: null,
          type: 'castle_queenside',
          isCheck: false,
          isCheckmate: false,
        });
      }
    }
  } else if (color === 'black' && row === 0 && col === 4) {
    // Black kingside castling
    if (
      game.castlingRights.blackKingside &&
      !game.board[0][5] &&
      !game.board[0][6] &&
      game.board[0][7] === 'R'
    ) {
      if (
        !isSquareAttacked(game, 0, 4, 'white') &&
        !isSquareAttacked(game, 0, 5, 'white') &&
        !isSquareAttacked(game, 0, 6, 'white')
      ) {
        moves.push({
          fromPiece,
          toPiece: fromPiece,
          fromRow: row,
          fromCol: col,
          toRow: 0,
          toCol: 6,
          capture: null,
          secondCapture: null,
          type: 'castle_kingside',
          isCheck: false,
          isCheckmate: false,
        });
      }
    }
    // Black queenside castling
    if (
      game.castlingRights.blackQueenside &&
      !game.board[0][3] &&
      !game.board[0][2] &&
      !game.board[0][1] &&
      game.board[0][0] === 'R'
    ) {
      if (
        !isSquareAttacked(game, 0, 4, 'white') &&
        !isSquareAttacked(game, 0, 3, 'white') &&
        !isSquareAttacked(game, 0, 2, 'white')
      ) {
        moves.push({
          fromPiece,
          toPiece: fromPiece,
          fromRow: row,
          fromCol: col,
          toRow: 0,
          toCol: 2,
          capture: null,
          secondCapture: null,
          type: 'castle_queenside',
          isCheck: false,
          isCheckmate: false,
        });
      }
    }
  }

  return moves;
}

function getQueenMoves(game, row, col, color) {
  const moves = [];
  const fromPiece = game.board[row][col];

  // Queen moves like rook + bishop
  const directions = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];

  for (const [dr, dc] of directions) {
    for (let dist = 1; dist < 8; dist++) {
      const newRow = row + dr * dist;
      const newCol = col + dc * dist;
      if (!isValidSquare(newRow, newCol)) break;

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
      } else {
        if (getPieceColor(target) !== color) {
          moves.push({
            fromPiece,
            toPiece: fromPiece,
            fromRow: row,
            fromCol: col,
            toRow: newRow,
            toCol: newCol,
            capture: { row: newRow, col: newCol, piece: target },
            secondCapture: null,
            type: 'move',
            isCheck: false,
            isCheckmate: false,
          });
        }
        break;
      }
    }
  }

  return moves;
}

function getRookMoves(game, row, col, color) {
  const moves = [];
  const fromPiece = game.board[row][col];

  // Rook moves orthogonally
  const directions = [
    [-1, 0],
    [0, -1],
    [0, 1],
    [1, 0],
  ];

  for (const [dr, dc] of directions) {
    for (let dist = 1; dist < 8; dist++) {
      const newRow = row + dr * dist;
      const newCol = col + dc * dist;
      if (!isValidSquare(newRow, newCol)) break;

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
      } else {
        if (getPieceColor(target) !== color) {
          moves.push({
            fromPiece,
            toPiece: fromPiece,
            fromRow: row,
            fromCol: col,
            toRow: newRow,
            toCol: newCol,
            capture: { row: newRow, col: newCol, piece: target },
            secondCapture: null,
            type: 'move',
            isCheck: false,
            isCheckmate: false,
          });
        }
        break;
      }
    }
  }

  return moves;
}

function getBishopMoves(game, row, col, color) {
  const moves = [];
  const fromPiece = game.board[row][col];

  // Bishop moves diagonally
  const directions = [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ];

  for (const [dr, dc] of directions) {
    for (let dist = 1; dist < 8; dist++) {
      const newRow = row + dr * dist;
      const newCol = col + dc * dist;
      if (!isValidSquare(newRow, newCol)) break;

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
      } else {
        if (getPieceColor(target) !== color) {
          moves.push({
            fromPiece,
            toPiece: fromPiece,
            fromRow: row,
            fromCol: col,
            toRow: newRow,
            toCol: newCol,
            capture: { row: newRow, col: newCol, piece: target },
            secondCapture: null,
            type: 'move',
            isCheck: false,
            isCheckmate: false,
          });
        }
        break;
      }
    }
  }

  return moves;
}

function getKnightMoves(game, row, col, color) {
  const moves = [];
  const fromPiece = game.board[row][col];

  // Knight L-shaped moves
  const offsets = [
    [-2, -1],
    [-2, 1],
    [-1, -2],
    [-1, 2],
    [1, -2],
    [1, 2],
    [2, -1],
    [2, 1],
  ];

  for (const [dr, dc] of offsets) {
    const newRow = row + dr;
    const newCol = col + dc;
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
      }
    }
  }

  return moves;
}

function getPawnMoves(game, row, col, color) {
  const moves = [];
  const fromPiece = game.board[row][col];
  const direction = color === 'white' ? -1 : 1;
  const startRow = color === 'white' ? 6 : 1;
  const promotionRow = color === 'white' ? 0 : 7;

  // Forward move
  const oneForward = row + direction;
  if (isValidSquare(oneForward, col) && !game.board[oneForward][col]) {
    if (oneForward === promotionRow) {
      moves.push({
        fromPiece,
        toPiece: color === 'white' ? 'q' : 'Q',
        fromRow: row,
        fromCol: col,
        toRow: oneForward,
        toCol: col,
        capture: null,
        secondCapture: null,
        type: 'promotion',
        isCheck: false,
        isCheckmate: false,
      });
    } else {
      moves.push({
        fromPiece,
        toPiece: fromPiece,
        fromRow: row,
        fromCol: col,
        toRow: oneForward,
        toCol: col,
        capture: null,
        secondCapture: null,
        type: 'move',
        isCheck: false,
        isCheckmate: false,
      });
    }

    // Two squares forward from starting position
    if (row === startRow) {
      const twoForward = row + direction * 2;
      if (!game.board[twoForward][col]) {
        moves.push({
          fromPiece,
          toPiece: fromPiece,
          fromRow: row,
          fromCol: col,
          toRow: twoForward,
          toCol: col,
          capture: null,
          secondCapture: null,
          type: 'pawn_double',
          isCheck: false,
          isCheckmate: false,
        });
      }
    }
  }

  // Diagonal captures
  for (const dc of [-1, 1]) {
    const newRow = row + direction;
    const newCol = col + dc;
    if (isValidSquare(newRow, newCol)) {
      const target = game.board[newRow][newCol];
      if (target && getPieceColor(target) !== color) {
        if (newRow === promotionRow) {
          moves.push({
            fromPiece,
            toPiece: color === 'white' ? 'q' : 'Q',
            fromRow: row,
            fromCol: col,
            toRow: newRow,
            toCol: newCol,
            capture: { row: newRow, col: newCol, piece: target },
            secondCapture: null,
            type: 'promotion',
            isCheck: false,
            isCheckmate: false,
          });
        } else {
          moves.push({
            fromPiece,
            toPiece: fromPiece,
            fromRow: row,
            fromCol: col,
            toRow: newRow,
            toCol: newCol,
            capture: { row: newRow, col: newCol, piece: target },
            secondCapture: null,
            type: 'move',
            isCheck: false,
            isCheckmate: false,
          });
        }
      }
    }
  }

  // En passant
  if (game.enPassantTarget) {
    const epRow = game.enPassantTarget.row;
    const epCol = game.enPassantTarget.col;
    if (Math.abs(epCol - col) === 1 && epRow === row + direction) {
      const capturedPawnRow = color === 'white' ? epRow + 1 : epRow - 1;
      const capturedPawn = game.board[capturedPawnRow]?.[epCol] ?? null;
      moves.push({
        fromPiece,
        toPiece: fromPiece,
        fromRow: row,
        fromCol: col,
        toRow: epRow,
        toCol: epCol,
        capture: capturedPawn ? { row: capturedPawnRow, col: epCol, piece: capturedPawn } : null,
        secondCapture: null,
        type: 'en_passant',
        isCheck: false,
        isCheckmate: false,
      });
    }
  }

  return moves;
}

function isSquareAttacked(game, row, col, byColor) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = game.board[r][c];
      if (piece && getPieceColor(piece) === byColor) {
        const pieceType = piece.toLowerCase();

        // Special case for pawns (they attack differently than they move)
        if (pieceType === 'p') {
          const direction = byColor === 'white' ? -1 : 1;
          if (r + direction === row && Math.abs(c - col) === 1) {
            return true;
          }
        }
        // Special case for kings to avoid infinite recursion
        else if (pieceType === 'k') {
          if (Math.abs(r - row) <= 1 && Math.abs(c - col) <= 1) {
            return true;
          }
        } else {
          const moves = getMoves(game, r, c);
          if (moves.some((m) => m.toRow === row && m.toCol === col)) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

function wouldBeInCheck(game, move, color) {
  const newGame = makeMove(game, move);
  return isInCheck(newGame, color);
}

function isInCheck(game, color) {
  const kingPos = findKing(game, color);
  if (!kingPos) return false;

  const opponentColor = color === 'white' ? 'black' : 'white';
  return isSquareAttacked(game, kingPos.row, kingPos.col, opponentColor);
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
  const isPawnMove = piece.toLowerCase() === 'p';

  // Create new board copy
  const newBoard = game.board.map((row) => [...row]);

  // Copy castling rights
  const newCastlingRights = { ...game.castlingRights };

  // Reset en passant
  let newEnPassantTarget = null;

  const state = {
    board: game.board.map((row) => [...row]),
    currentPlayer: game.currentPlayer,
    halfMoveCount: game.halfMoveCount,
    move: move ? { ...move } : null,
    castlingRights: { ...game.castlingRights },
    enPassantTarget: game.enPassantTarget,
  };

  let capture = false;

  switch (type) {
    case 'castle_kingside': {
      newBoard[toRow][toCol] = piece;
      newBoard[fromRow][fromCol] = null;
      // Move the rook
      if (color === 'white') {
        newBoard[7][5] = newBoard[7][7];
        newBoard[7][7] = null;
      } else {
        newBoard[0][5] = newBoard[0][7];
        newBoard[0][7] = null;
      }
      break;
    }
    case 'castle_queenside': {
      newBoard[toRow][toCol] = piece;
      newBoard[fromRow][fromCol] = null;
      // Move the rook
      if (color === 'white') {
        newBoard[7][3] = newBoard[7][0];
        newBoard[7][0] = null;
      } else {
        newBoard[0][3] = newBoard[0][0];
        newBoard[0][0] = null;
      }
      break;
    }
    case 'en_passant': {
      newBoard[toRow][toCol] = piece;
      newBoard[fromRow][fromCol] = null;
      // Remove the captured pawn
      const capturedPawnRow = color === 'white' ? toRow + 1 : toRow - 1;
      newBoard[capturedPawnRow][toCol] = null;
      capture = true;
      break;
    }
    case 'pawn_double': {
      newBoard[toRow][toCol] = piece;
      newBoard[fromRow][fromCol] = null;
      // Set en passant target
      const epRow = color === 'white' ? toRow + 1 : toRow - 1;
      newEnPassantTarget = { row: epRow, col: toCol };
      break;
    }
    case 'promotion': {
      // Always promote to queen for simplicity
      newBoard[toRow][toCol] = color === 'white' ? 'q' : 'Q';
      newBoard[fromRow][fromCol] = null;
      capture = game.board[toRow][toCol] !== null;
      break;
    }
    default: {
      const target = newBoard[toRow][toCol];
      if (target) capture = true;
      newBoard[toRow][toCol] = piece;
      newBoard[fromRow][fromCol] = null;
    }
  }

  // Update castling rights
  if (piece.toLowerCase() === 'k') {
    if (color === 'white') {
      newCastlingRights.whiteKingside = false;
      newCastlingRights.whiteQueenside = false;
    } else {
      newCastlingRights.blackKingside = false;
      newCastlingRights.blackQueenside = false;
    }
  }
  if (piece.toLowerCase() === 'r') {
    if (color === 'white') {
      if (fromRow === 7 && fromCol === 0) newCastlingRights.whiteQueenside = false;
      if (fromRow === 7 && fromCol === 7) newCastlingRights.whiteKingside = false;
    } else {
      if (fromRow === 0 && fromCol === 0) newCastlingRights.blackQueenside = false;
      if (fromRow === 0 && fromCol === 7) newCastlingRights.blackKingside = false;
    }
  }

  let newHalfMoveCount;
  if (isPawnMove || capture) {
    newHalfMoveCount = 0;
  } else {
    newHalfMoveCount = game.halfMoveCount + 1;
  }

  return Object.freeze({
    board: newBoard,
    currentPlayer: game.currentPlayer === 'white' ? 'black' : 'white',
    history: [...game.history, state],
    selectedPiece: null,
    gameOver: false,
    halfMoveCount: newHalfMoveCount,
    castlingRights: newCastlingRights,
    enPassantTarget: newEnPassantTarget,
    gameName: game.gameName,
  });
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
    castlingRights: game.castlingRights,
    enPassantTarget: game.enPassantTarget,
  };
  let count = 0;
  for (const historyState of game.history) {
    if (statesEqual(currentState, historyState)) count++;
    if (count >= 3) return true;
  }
  return false;
}

function statesEqual(state1, state2) {
  return (
    boardsEqual(state1.board, state2.board) &&
    state1.currentPlayer === state2.currentPlayer &&
    JSON.stringify(state1.castlingRights) === JSON.stringify(state2.castlingRights) &&
    JSON.stringify(state1.enPassantTarget) === JSON.stringify(state2.enPassantTarget)
  );
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
    castlingRights: state.castlingRights,
    enPassantTarget: state.enPassantTarget,
    gameName: game.gameName,
  });
}

export function reset() {
  return createGame();
}
