import { getGameName } from '$lib/board-games/Game.js';

export async function getLlmMove(game, apiKey, model, effort) {
  const R = getGameName(game);

  const prompt = R.llmPrompt(game);
  const validMoves = R.getAllValidMoves(game);

  try {
    const response = await queryAPI(prompt, model, apiKey, effort);
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Invalid response from the AI model.');
    }
    const moveStr = content.trim().split('\n').pop().trim();

    console.log(`LLM ${model} returned move string: ${moveStr}`);

    let move = null;
    if (game.gameName === '4-in-a-row' || game.gameName === 'hugs-and-kisses') {
      const col = Number.parseInt(moveStr, 10);
      if (Number.isInteger(col) && validMoves.includes(col)) {
        move = col;
      } else {
        console.error('Invalid column from the AI model.');
      }
    } else {
      move = R.parseMoveStr(moveStr, validMoves);
    }
    if (move == null) {
      console.error('Invalid move from the AI model.');
      return { move: null, error: 'Invalid move from the AI model.', isApiError: false };
    }
    return { move };
  } catch (error) {
    console.error('Error getting move from the AI model.', error);
    const errorMessage = error.message || 'Error getting move from the AI model.';
    return { move: null, error: errorMessage, isApiError: true };
  }
}

function getModelString(model) {
  switch (model) {
    case 'GPT-5 (August 2025)':
      return 'openai/gpt-5';
    case 'GPT-4.1 (April 2025)':
      return 'openai/gpt-4.1';
    case 'GPT-4o (2024-05-13; May 2024)':
      return 'openai/gpt-4o-2024-05-13';
    case 'GPT-3.5-turbo (v0613; June 2023)':
      return 'openai/gpt-3.5-turbo-0613';
    default:
      return model || null;
  }
}

export function modelSupportsReasoning(model) {
  return model === 'GPT-5 (August 2025)' || model === 'GPT-4.1 (April 2025)';
}

async function queryAPI(prompt, model, apiKey, effort) {
  const modelString = getModelString(model);

  if (!apiKey) {
    throw new Error('Missing OpenRouter API key.');
  }
  if (!modelString) {
    throw new Error('Unsupported model selected.');
  }

  let reasoningParams = null;

  switch (model) {
    case 'GPT-5 (August 2025)':
      reasoningParams = {
        enabled: true,
        effort: effort,
        exclude: true,
      };
      break;
    case 'GPT-4.1 (April 2025)':
      reasoningParams = {
        enabled: true,
        effort: effort,
        exclude: true,
      };
      break;
    case 'GPT-4o (2024-05-13; May 2024)':
      reasoningParams = { enabled: false };
      break;
    case 'GPT-3.5-turbo (v0613; June 2023)':
      reasoningParams = { enabled: false };
      break;
    default:
      if (effort && effort !== '' && effort !== 'none') {
        reasoningParams = {
          enabled: true,
          effort: effort,
          exclude: true,
        };
      } else {
        reasoningParams = { enabled: false };
      }
      break;
  }

  console.log('Querying AI model: ', modelString);

  const requestBody = {
    model: modelString,
    messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
  };

  if (reasoningParams && reasoningParams.enabled) {
    requestBody.reasoning = reasoningParams;
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    let msg = `LLM request failed (${response.status})`;
    let errorMessage = '';
    try {
      const error = await response.json();
      if (error?.error?.message) errorMessage = error.error.message;
      else if (error?.message) errorMessage = error.message;
    } catch {
      throw new Error('Parsing JSON response failed.');
    }
    throw new Error(msg + ': ' + errorMessage);
  }

  return response;
}
