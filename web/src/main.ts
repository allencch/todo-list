import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import { router } from './router';
import { connectWebSocket } from './utils/ws';

connectWebSocket();

createApp(App)
  .use(router)
  .mount('#app');
