import { Hono } from 'hono';
import { helloRoute } from './routes/hello.route.ts';

const app = new Hono();

// Mount the hello route
app.route('/hello', helloRoute);

app.get('/', (c) => {
  return c.text('Welcome to the API!');
});

Deno.serve(app.fetch);
