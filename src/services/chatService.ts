import { API_URL, authHeaders } from '../config';

interface StreamChatOptions {
  token: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  userProfile?: object;
  planContext?: string;
  onToken: (text: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
}

/**
 * Streams a chat response from the APEX backend using SSE.
 * Calls onToken for each text chunk, onDone when complete, onError on failure.
 */
export async function streamChat({
  token,
  messages,
  userProfile = {},
  planContext = '',
  onToken,
  onDone,
  onError,
}: StreamChatOptions): Promise<void> {
  let res: Response;

  try {
    res = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ messages, userProfile, planContext }),
    });
  } catch (e: any) {
    onError(e.message ?? 'Network request failed');
    return;
  }

  if (res.status === 402) {
    onError('out_of_credits');
    return;
  }

  if (!res.ok) {
    try {
      const data = await res.json();
      onError(data.detail ?? data.error ?? `Server error ${res.status}`);
    } catch {
      onError(`Server error ${res.status}`);
    }
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    onError('Streaming not supported on this platform');
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE messages are separated by double newlines
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';

      for (const part of parts) {
        for (const line of part.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();

          if (data === '[DONE]') {
            onDone();
            return;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.text) onToken(parsed.text);
            if (parsed.error) {
              onError(parsed.error);
              return;
            }
          } catch {
            // ignore malformed chunks
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  onDone();
}
