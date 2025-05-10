import 'https://deno.land/std@0.224.0/dotenv/load.ts';
import { Hono } from 'hono';
import { healthRoute } from '@/health/health.route.ts';
import { parseRoute } from '@/parse/parse.route.ts';

// Initialize the Hono app
const app = new Hono();

app.route('/health', healthRoute);
app.route('/parse', parseRoute);

// Define a simple root route
app.get('/', (c) => {
  return c.text('Welcome to the API!');
});

// Start the Deno server and serve the Hono app
Deno.serve(app.fetch);
