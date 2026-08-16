import { ref } from 'vue';

export const clientId = ref<string | null>(null);

type TodoChangedListener = (id: number) => void;

const listeners = new Set<TodoChangedListener>();

let started = false;

function connect() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const socket = new WebSocket(`${protocol}//${window.location.host}/api/ws`);

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);

    if (message.type === 'connected') {
      clientId.value = message.clientId;
      return;
    }

    if (message.type === 'todo.changed') {
      listeners.forEach((listener) => listener(message.id));
    }
  });

  socket.addEventListener('close', () => {
    clientId.value = null;
    setTimeout(connect, 2000);
  });
}

// Call once from the app's entry point (main.ts), not at module import time --
// importing this module (or anything that imports it, like utils/http.ts)
// must not have the side effect of opening a real network connection, or every
// test that touches those modules ends up trying to connect a real WebSocket.
export function connectWebSocket() {
  if (started) return;
  started = true;
  connect();
}

export function onTodoChanged(listener: TodoChangedListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
