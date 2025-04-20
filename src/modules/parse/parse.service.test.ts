/**
 * Test suite for the ParseService.
 * @module
 */

import {
  assertEquals,
  assertRejects,
} from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { ParseService } from './parse.service.ts';

Deno.test('ParseService', async (t) => {
  let parseService: ParseService;

  await t.step('processImage should throw if image is missing', async () => {
    parseService = new ParseService();
    await assertRejects(
      () => parseService.processImage(undefined as unknown as File),
      Error,
      'Image file is required'
    );
  });

  await t.step(
    'processImage should return placeholder result for valid input',
    async () => {
      parseService = new ParseService();
      const fakeFile = new File([new Uint8Array([1, 2, 3])], 'test.jpg', {
        type: 'image/jpeg',
      });
      const result = await parseService.processImage(fakeFile);
      assertEquals(
        result,
        `Parsed result for prompt: "Extract the text from the image" (image size: 3 bytes)`
      );
    }
  );
});
