import { randomUUID } from 'node:crypto';
import type { WebSocket } from 'ws';

const clients = new Map<string, WebSocket>();

export function registerClient(socket: WebSocket): string {
  const clientId = randomUUID();
  clients.set(clientId, socket);

  socket.on('close', () => {
    clients.delete(clientId);
  });

  return clientId;
}

// Notifies every connected client that todo `id` changed, except the one that
// caused it (identified by the X-Client-Id header on the mutating request).
export function broadcastTodoChanged(id: number, originClientId?: string) {
  const message = JSON.stringify({ type: 'todo.changed', id });

  for (const [clientId, socket] of clients) {
    if (clientId === originClientId) continue;
    if (socket.readyState === socket.OPEN) {
      socket.send(message);
    }
  }
}
