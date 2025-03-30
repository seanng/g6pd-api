import { Hono } from 'hono';
import { healthRoute } from '@/health/health.route.ts';

// Initialize the Hono app
const app = new Hono();

// Mount the health check route under /health
app.route('/health', healthRoute);

// Define a simple root route
app.get('/', (c) => {
  return c.text('Welcome to the API!');
});

// Start the Deno server and serve the Hono app
Deno.serve(app.fetch);
