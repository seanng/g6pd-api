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
    'POST /parse should return parsed result for valid image',
    async () => {
      // Create a small JPEG file (3x3 pixels)
      const imageData = new Uint8Array([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
        0x00, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x03, 0x00, 0x03, 0x01, 0x01,
        0x11, 0x00, 0xff, 0xc4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x09,
        0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0xff, 0xd9,
      ]);

      const fakeFile = new File([imageData], 'test.jpg', {
        type: 'image/jpeg',
      });
      const form = new FormData();
      form.append('image', fakeFile);
      const req = new Request('http://localhost/parse', {
        method: 'POST',
        body: form,
      });
      const res = await app.request(req);
      const json = await res.json();
      assertEquals(res.status, 200);
      assertObjectMatch(json, {
        success: true,
        data: `Parsed result for prompt: "Extract the text from the image" (image size: ${imageData.length} bytes)`,
      });
    }
  );

  await t.step(
    'POST /parse should return 400 if image is missing',
    async () => {
      const form = new FormData();
      const req = new Request('http://localhost/parse', {
        method: 'POST',
        body: form,
      });
      const res = await app.request(req);
      assertEquals(res.status, 400);
      const json = await res.json();
      assertEquals(json.message, 'Input not instance of File');
    }
  );

  await t.step(
    'POST /parse should return 400 if file type is invalid',
    async () => {
      const fakeFile = new File(['test'], 'test.txt', {
        type: 'text/plain',
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
      assertEquals(
        json.message,
        'Only .jpg, .jpeg, .png, and .webp formats are supported'
      );
    }
  );
});
