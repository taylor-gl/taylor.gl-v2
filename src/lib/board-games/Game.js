import * as C4 from '$lib/board-games/4InARow.js';
import * as Chess from '$lib/board-games/Chess.js';
import * as FC from '$lib/board-games/FantasticalChess.js';
import * as GO from '$lib/board-games/Go.js';
import * as HK from '$lib/board-games/HugsAndKisses.js';
import * as SH from '$lib/board-games/Shove.js';

export function getGameName(game) {
  const name = game?.gameName;
  switch (name) {
    case 'regular-chess':
      return Chess;
    case 'fantastical-chess':
      return FC;
    case 'go-9x9':
      return GO;
    case 'shove':
      return SH;
    case 'hugs-and-kisses':
      return HK;
    case '4-in-a-row':
      return C4;
    default:
      return C4;
  }
}
