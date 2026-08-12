export async function safeParseJson(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function buildErrorMessage(body: any) {
  if (typeof body?.error === 'string') {
    return body.error;
  }

  return (
    Object.entries(body?.error?.fieldErrors ?? {})
      .map(([key, value]) => `${key}: ${value}`)
      .join('; ') || 'Something went wrong.'
  );
}
