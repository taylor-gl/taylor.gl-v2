import { browser } from '$app/environment';
import * as FC from '$lib/board-games/FantasticalChess.js';

const GAME_STORAGE_KEY = 'board-games-game';
const API_KEY_STORAGE_KEY = 'board-games-api-key';

export const load = async () => {
  let initialGame;
  let openRouterApiKey = '';

  if (browser) {
    try {
      const savedGame = localStorage.getItem(GAME_STORAGE_KEY);
      if (savedGame) {
        initialGame = JSON.parse(savedGame);
      } else {
        initialGame = FC.createGame();
      }

      const savedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
      if (savedApiKey) {
        openRouterApiKey = savedApiKey;
      }
    } catch {
      initialGame = FC.createGame();
    }
  } else {
    initialGame = FC.createGame();
  }

  return { initialGame, openRouterApiKey };
};
