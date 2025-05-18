/**
 * Test suite for the ParseRoute.
 * @module
 */

import {
  assertEquals,
  assertExists,
} from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

// Mock the dotenv module
// This needs to happen before importing the route
const originalReadTextFileSync = Deno.readTextFileSync;
Deno.readTextFileSync = (path: string | URL) => {
  if (String(path).includes('.env')) {
    return 'GOOGLE_API_KEY=mock-test-api-key';
  }
  return originalReadTextFileSync(path);
};

// Mock fetch before importing route
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  return {
    ok: true,
    json: async () => ({
      candidates: [
        {
          content: {
            parts: [
              {
                text: '{"status":"success","message":"","harmful_ingredients":["Acetanilide"]}',
              },
            ],
          },
        },
      ],
    }),
  } as Response;
};

// Now import the route after mocking
import { parseRoute } from './parse.route.ts';

Deno.test('ParseRoute tests', async (t) => {
  // Set up API key
  Deno.env.set('GOOGLE_API_KEY', 'test-api-key');

  // Create a new Hono app for testing
  const app = new Hono();

  // Add error handler for consistent JSON responses
  app.onError((err, c) => {
    const status = err instanceof HTTPException ? err.status : 500;
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ message }, status);
  });

  app.route('/parse', parseRoute);

  await t.step(
    'POST / should return error when no image is provided',
    async () => {
      const formData = new FormData();

      const res = await app.request('http://localhost/parse', {
        method: 'POST',
        body: formData,
      });

      assertEquals(res.status, 400);
      const data = await res.json();
      assertExists(data.message);
    }
  );

  await t.step('POST / should return error for invalid file type', async () => {
    const formData = new FormData();
    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    formData.append('image', invalidFile);

    const res = await app.request('http://localhost/parse', {
      method: 'POST',
      body: formData,
    });

    assertEquals(res.status, 400);
    const data = await res.json();
    assertExists(data.message);
    assertEquals(
      data.message,
      'Only .jpg, .jpeg, .png, and .webp formats are supported'
    );
  });

  await t.step('POST / should return success with valid image', async () => {
    const formData = new FormData();
    const validFile = new File([new Uint8Array([1, 2, 3])], 'test.jpg', {
      type: 'image/jpeg',
    });
    formData.append('image', validFile);

    const res = await app.request('http://localhost/parse', {
      method: 'POST',
      body: formData,
    });

    assertEquals(res.status, 200);
    const data = await res.json();
    assertEquals(data.success, true);
    assertExists(data.data);
    assertExists(data.data.harmful_ingredients);
    assertEquals(data.data.harmful_ingredients.length, 1);
    assertEquals(data.data.harmful_ingredients[0], 'Acetanilide');
  });

  // Add a final cleanup step
  await t.step('cleanup', () => {
    globalThis.fetch = originalFetch;
    Deno.readTextFileSync = originalReadTextFileSync;
  });
});
