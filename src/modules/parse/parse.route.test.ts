/**
 * Test suite for the parse route.
 * @module
 */

import {
  assertEquals,
  assertObjectMatch,
} from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { Hono } from 'hono';
import { parseRoute } from './parse.route.ts';

Deno.test('Parse Route', async (t) => {
  const app = new Hono();
  // Add a global error handler to return errors as JSON
  app.onError((err, c) => {
    const status = (err as any).status ?? 500;
    return c.json({ message: err.message }, status);
  });
  app.route('/parse', parseRoute);

  await t.step(
    'POST /parse should return parsed result for valid image and prompt',
    async () => {
      const fakeFile = new File([new Uint8Array([1, 2, 3])], 'test.jpg', {
        type: 'image/jpeg',
      });
      const form = new FormData();
      form.append('image', fakeFile);
      form.append('prompt', 'Test prompt');
      const req = new Request('http://localhost/parse', {
        method: 'POST',
        body: form,
      });
      const res = await app.request(req);
      const json = await res.json();
      assertEquals(res.status, 200);
      assertObjectMatch(json, {
        success: true,
        data: `Parsed result for prompt: "Test prompt" (image size: 3 bytes)`,
      });
    }
  );

  await t.step(
    'POST /parse should return 400 if image is missing',
    async () => {
      const form = new FormData();
      form.append('prompt', 'Test prompt');
      const req = new Request('http://localhost/parse', {
        method: 'POST',
        body: form,
      });
      const res = await app.request(req);
      assertEquals(res.status, 400);
      const json = await res.json();
      assertEquals(json.message, '"image" must be a file');
    }
  );

  await t.step(
    'POST /parse should return 400 if prompt is missing',
    async () => {
      const fakeFile = new File([new Uint8Array([1, 2, 3])], 'test.jpg', {
        type: 'image/jpeg',
      });
      const form = new FormData();
      form.append('image', fakeFile);
      const req = new Request('http://localhost/parse', {
        method: 'POST',
        body: form,
      });
      const res = await app.request(req);
      assertEquals(res.status, 400);
      const json = await res.json();
      assertEquals(json.message, '"prompt" must be a non-empty string');
    }
  );
});
