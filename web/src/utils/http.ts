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
