import { clientId } from './ws';

// Tags mutating requests with this tab's WS client id, so the server can skip
// re-notifying the tab that caused the change over the WebSocket broadcast.
export function apiFetch(input: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (clientId.value) {
    headers.set('X-Client-Id', clientId.value);
  }
  return fetch(input, { ...init, headers });
}

export async function safeParseJson(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

interface ErrorResponseBody {
  error?: string | { fieldErrors?: Record<string, string[]> };
}

function isErrorResponseBody(value: unknown): value is ErrorResponseBody {
  return typeof value === 'object' && value !== null;
}

export function buildErrorMessage(body: unknown) {
  if (!isErrorResponseBody(body)) {
    return 'Something went wrong.';
  }

  const { error } = body;

  if (typeof error === 'string') {
    return error;
  }

  return (
    Object.entries(error?.fieldErrors ?? {})
      .map(([key, value]) => `${key}: ${value}`)
      .join('; ') || 'Something went wrong.'
  );
}
