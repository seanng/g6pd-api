import { Hono } from 'hono';
import { ParseService } from './parse.service.ts';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

/**
 * Hono router instance for handling image parsing requests.
 */
export const parseRoute = new Hono();

const parseService = new ParseService();

// Maximum file size: 10MB in bytes
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const multipartSchema = z.object({
  image: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_FILE_SIZE, {
      message: `File size must be less than or equal to ${
        MAX_FILE_SIZE / (1024 * 1024)
      }MB`,
    })
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      {
        message: 'Only .jpg, .jpeg, .png, and .webp formats are supported',
      }
    ),
});

/**
 * Defines the POST / endpoint for image parsing.
 * Retrieves the image from the request body,
 * uses the ParseService to process them via Gemini,
 * and returns the result as JSON.
 */
parseRoute.post(
  '/',
  zValidator('form', multipartSchema, (result) => {
    if (!result.success) {
      const errorMessage = result.error.errors
        .map((err: any) => err.message)
        .join(', ');
      throw new HTTPException(422, { message: errorMessage });
    }
  }) as any,
  async (c) => {
    try {
      const { image } = (c as any).req.valid('form') as { image: File };

      // Use the service instance to process the image
      const result = await parseService.processImage(image);

      return c.json({
        success: true,
        data: {
          harmful_ingredients: result.harmful_ingredients,
          original_text: result.original_text,
          translated_text: result.translated_text,
        },
      });
    } catch (error: unknown) {
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
  }
);
