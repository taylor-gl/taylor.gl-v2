export function randomMove(legalMoves) {
  return legalMoves[Math.floor(Math.random() * legalMoves.length)];
}
