import { getClient } from './client.ts';
import type { ToolHandlers } from '../tools/handlers/index.ts';

export type ContentBlock = { type: 'text'; text: string };

export type SwoopEvent =
  | { type: 'user.message'; content: ContentBlock[] }
  | { type: 'user.custom_tool_result'; custom_tool_use_id: string; content: ContentBlock[]; is_error?: boolean };

export async function emitEvent(sessionId: string, event: SwoopEvent): Promise<void> {
  const client = getClient();
  await client.beta.sessions.events.send(sessionId, { events: [event as never] });
}

export async function streamEvents(sessionId: string) {
  const client = getClient();
  return await client.beta.sessions.events.stream(sessionId);
}

export async function sendMessage(sessionId: string, text: string): Promise<void> {
  await emitEvent(sessionId, {
    type: 'user.message',
    content: [{ type: 'text', text }],
  });
}

export function textResult(text: string): ContentBlock[] {
  return [{ type: 'text', text }];
}

/**
 * Consume the SSE stream for a session, dispatching tool calls to handlers
 * and collecting the final agent message text.
 *
 * When the agent emits agent.custom_tool_use the session enters requires_action.
 * We execute the tool locally and send user.custom_tool_result to resume.
 */
/**
 * Send a message and consume the response stream in one call.
 * Opens the stream BEFORE sending the message so no events are missed.
 */
export async function sendAndConsumeStream(
  sessionId: string,
  text: string,
  handlers: ToolHandlers,
  onText?: (chunk: string) => void,
): Promise<string> {
  // Open stream first, then send — events are emitted to the open stream
  const stream = await streamEvents(sessionId);
  // Fire-and-forget the send after stream is open
  emitEvent(sessionId, { type: 'user.message', content: [{ type: 'text', text }] }).catch(() => {});
  return _consumeStream(sessionId, stream, handlers, onText);
}

export async function consumeStream(
  sessionId: string,
  handlers: ToolHandlers,
  onText?: (chunk: string) => void,
): Promise<string> {
  const stream = await streamEvents(sessionId);
  return _consumeStream(sessionId, stream, handlers, onText);
}

async function _consumeStream(
  sessionId: string,
  stream: AsyncIterable<unknown>,
  handlers: ToolHandlers,
  onText?: (chunk: string) => void,
): Promise<string> {
  const textParts: string[] = [];

  for await (const event of stream) {
    const e = event as unknown as Record<string, unknown>;
    const eventType = e['type'] as string | undefined;

    if (eventType === 'agent.message') {
      // content is [{ type: 'text', text: '...' }, ...]
      const content = e['content'] as { type: string; text?: string }[] | undefined;
      const text = content?.filter(b => b.type === 'text').map(b => b.text ?? '').join('') ?? '';
      textParts.push(text);
      onText?.(text);
      continue;
    }

    if (eventType === 'agent.custom_tool_use') {
      const toolUseId = e['custom_tool_use_id'] as string;
      const toolName = e['name'] as string;
      const input = (e['input'] ?? {}) as Record<string, unknown>;

      const handler = handlers[toolName];
      if (!handler) {
        await emitEvent(sessionId, {
          type: 'user.custom_tool_result',
          custom_tool_use_id: toolUseId,
          content: textResult(JSON.stringify({ error: `Unknown tool: ${toolName}` })),
          is_error: true,
        });
        continue;
      }

      try {
        const result = await handler(input);
        await emitEvent(sessionId, {
          type: 'user.custom_tool_result',
          custom_tool_use_id: toolUseId,
          content: textResult(JSON.stringify(result)),
        });
      } catch (err) {
        await emitEvent(sessionId, {
          type: 'user.custom_tool_result',
          custom_tool_use_id: toolUseId,
          content: textResult(JSON.stringify({ error: err instanceof Error ? err.message : String(err) })),
          is_error: true,
        });
      }
    }

    // Break when session is idle (agent finished responding) or completed
    if (
      eventType === 'session.turn_complete' ||
      eventType === 'session.status_idle' ||
      eventType === 'session.completed' ||
      (eventType === 'session.status' && (e['status'] === 'idle' || e['status'] === 'completed'))
    ) {
      break;
    }
  }

  return textParts.join('');
}
