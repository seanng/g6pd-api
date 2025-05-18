/**
 * Test suite for the ParseService.
 * @module
 */

import {
  assertEquals,
  assertRejects,
} from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { ParseService } from './parse.service.ts';
import { HTTPException } from 'hono/http-exception';

// Mock the dotenv module
// This needs to happen before importing the service
const originalReadTextFileSync = Deno.readTextFileSync;
Deno.readTextFileSync = (path: string | URL) => {
  if (String(path).includes('.env')) {
    return 'GOOGLE_API_KEY=mock-test-api-key';
  }
  return originalReadTextFileSync(path);
};

// Mock the fetch function
const originalFetch = globalThis.fetch;

Deno.test('ParseService tests', async (t) => {
  let parseService: ParseService;
  parseService = new ParseService();

  // Make sure the API key is set for testing
  if (!Deno.env.get('GOOGLE_API_KEY')) {
    Deno.env.set('GOOGLE_API_KEY', 'test-api-key');
  }

  await t.step('processImage should throw if image is missing', async () => {
    await assertRejects(
      () => parseService.processImage(undefined as unknown as File),
      HTTPException,
      'Image file is required'
    );
  });

  await t.step(
    'processImage should handle successful API response with no harmful ingredients',
    async () => {
      // Mock successful API response
      globalThis.fetch = async () => {
        return {
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: '{"status":"success","message":"","harmful_ingredients":[]}',
                    },
                  ],
                },
              },
            ],
          }),
        } as Response;
      };

      const fakeFile = new File([new Uint8Array([1, 2, 3])], 'test.jpg', {
        type: 'image/jpeg',
      });

      const result = await parseService.processImage(fakeFile);
      assertEquals(result.harmful_ingredients, []);
    }
  );

  await t.step(
    'processImage should handle successful API response with harmful ingredients',
    async () => {
      // Mock successful API response with harmful ingredients
      globalThis.fetch = async () => {
        return {
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: '{"status":"success","message":"","harmful_ingredients":["Acetanilide","Acetazolamide"]}',
                    },
                  ],
                },
              },
            ],
          }),
        } as Response;
      };

      const fakeFile = new File([new Uint8Array([1, 2, 3])], 'test.jpg', {
        type: 'image/jpeg',
      });

      const result = await parseService.processImage(fakeFile);
      assertEquals(result.harmful_ingredients, [
        'Acetanilide',
        'Acetazolamide',
      ]);
    }
  );

  await t.step(
    'processImage should handle error response from AI',
    async () => {
      // Mock API response with error
      globalThis.fetch = async () => {
        return {
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: '{"status":"error","message":"Text is too blurry to read","harmful_ingredients":[]}',
                    },
                  ],
                },
              },
            ],
          }),
        } as Response;
      };

      const fakeFile = new File([new Uint8Array([1, 2, 3])], 'test.jpg', {
        type: 'image/jpeg',
      });

      await assertRejects(
        () => parseService.processImage(fakeFile),
        HTTPException,
        'Text is too blurry to read'
      );
    }
  );

  await t.step(
    'processImage should handle invalid API response and retry',
    async () => {
      // Set up mocks with sequential responses
      let callCount = 0;
      globalThis.fetch = async () => {
        callCount++;
        // First call returns invalid format, second call returns valid format
        if (callCount === 1) {
          return {
            ok: true,
            json: async () => ({
              candidates: [
                {
                  content: {
                    parts: [
                      {
                        text: 'I found the following ingredients: Whole grain wheat, sugar, salt.',
                      },
                    ],
                  },
                },
              ],
            }),
          } as Response;
        } else {
          return {
            ok: true,
            json: async () => ({
              candidates: [
                {
                  content: {
                    parts: [
                      {
                        text: '{"status":"success","message":"","harmful_ingredients":[]}',
                      },
                    ],
                  },
                },
              ],
            }),
          } as Response;
        }
      };

      const fakeFile = new File([new Uint8Array([1, 2, 3])], 'test.jpg', {
        type: 'image/jpeg',
      });

      const result = await parseService.processImage(fakeFile);
      assertEquals(result.harmful_ingredients, []);
      assertEquals(callCount, 2, 'API should be called twice due to retry');
    }
  );

  await t.step('processImage should handle API errors', async () => {
    // Mock API error
    globalThis.fetch = async () => {
      return {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'API Error',
      } as Response;
    };

    const fakeFile = new File([new Uint8Array([1, 2, 3])], 'test.jpg', {
      type: 'image/jpeg',
    });

    await assertRejects(
      () => parseService.processImage(fakeFile),
      HTTPException,
      'Gemini API error'
    );
  });

  // Add a final cleanup step to restore original functions
  await t.step('cleanup', () => {
    globalThis.fetch = originalFetch;
    Deno.readTextFileSync = originalReadTextFileSync;
  });
});
