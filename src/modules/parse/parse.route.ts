import { Hono } from 'hono';
import { ParseService } from './parse.service.ts';
import { HTTPException } from 'hono/http-exception';

/**
 * Hono router instance for handling image parsing requests.
 */
export const parseRoute = new Hono();

/**
 * Instance of the ParseService used by the parse route.
 */
const parseService = new ParseService();

/**
 * Defines the POST / endpoint for image parsing.
 * Retrieves the image and prompt from the request body,
 * uses the ParseService to process them via Gemini,
 * and returns the result as JSON.
 */
parseRoute.post('/', async (c) => {
  try {
    // Consider adding limits to body parsing (e.g., c.req.parseBody({ maxSize: ... }))
    const body = await c.req.parseBody();
    const image = body['image'];
    const prompt = body['prompt'];

    // Basic validation
    if (!(image instanceof File)) {
      throw new HTTPException(400, { message: '"image" must be a file' });
    }
    if (typeof prompt !== 'string' || !prompt) {
      throw new HTTPException(400, {
        message: '"prompt" must be a non-empty string',
      });
    }

    // Use the service instance to process the image
    const result = await parseService.processImage(image, prompt);

    return c.json({ success: true, data: result });
  } catch (error) {
    console.error('Error in /parse route:', error);
    if (error instanceof HTTPException) {
      throw error; // Re-throw Hono's HTTPException
    }
    // Generic error
    throw new HTTPException(500, {
      message: 'Internal Server Error',
      cause: error,
    });
  }
});
