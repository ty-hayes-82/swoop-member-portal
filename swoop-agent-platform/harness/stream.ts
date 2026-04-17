import type { ServerResponse } from 'node:http';
import { streamEvents, emitEvent, textResult } from './events.ts';
import type { ToolHandlers } from '../tools/handlers/index.ts';

/**
 * Pipe a session's event stream to an HTTP response as Server-Sent Events.
 * Handles tool calls inline. Ends the response when the stream completes.
 */
export async function pipeSessionToSSE(
  sessionId: string,
  res: ServerResponse,
  handlers: ToolHandlers,
): Promise<void> {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const stream = await streamEvents(sessionId);

  try {
    for await (const event of stream) {
      const e = event as unknown as Record<string, unknown>;

      if (e['type'] === 'agent.message') {
        res.write(`data: ${JSON.stringify({ type: 'text', text: e['text'] })}\n\n`);
        continue;
      }

      if (e['type'] === 'agent.custom_tool_use') {
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

        // Inject session context for handlers that need it (e.g. request_human_confirmation)
        const enrichedInput = { ...input, _session_id: sessionId };

        try {
          const result = await handler(enrichedInput);
          res.write(`data: ${JSON.stringify({ type: 'tool_use', name: toolName, result })}\n\n`);
          await emitEvent(sessionId, {
            type: 'user.custom_tool_result',
            custom_tool_use_id: toolUseId,
            content: textResult(JSON.stringify(result)),
          });
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          await emitEvent(sessionId, {
            type: 'user.custom_tool_result',
            custom_tool_use_id: toolUseId,
            content: textResult(JSON.stringify({ error: errMsg })),
            is_error: true,
          });
        }
      }

      const t = e['type'] as string | undefined;
      if (
        t === 'session.turn_complete' || t === 'session.status_idle' || t === 'session.completed' ||
        (t === 'session.status' && (e['status'] === 'idle' || e['status'] === 'completed'))
      ) {
        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
        break;
      }
    }
  } finally {
    res.end();
  }
}
