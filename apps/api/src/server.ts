import { serve } from '@hono/node-server';
import { createApp } from './app';
import { loadConfig } from './config';

const config = loadConfig();
const app = createApp();

serve({ fetch: app.fetch, port: config.PORT }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`);
});
