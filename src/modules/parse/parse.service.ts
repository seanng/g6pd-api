import { HTTPException } from 'hono/http-exception';
import { encodeBase64 } from 'https://deno.land/std@0.224.0/encoding/base64.ts';
import { INITIAL_PROMPT, RETRY_PROMPT } from './parse.prompts.ts';

/**
 * Response type for the image parsing operation
 */
export interface ParseResponse {
  harmful_ingredients: string[];
}

/**
 * Service responsible for handling image parsing requests via Gemini API.
 */
export class ParseService {
  /**
   * Processes an image and prompt by sending them to the Gemini API.
   * @param image The image to parse.
   * @returns A promise resolving to a ParseResponse object.
   */
  async processImage(image: File | FormDataEntryValue): Promise<ParseResponse> {
    if (!image || !(image instanceof File)) {
      throw new HTTPException(400, { message: 'Image file is required' });
    }

    try {
      const imageData = await image.arrayBuffer();
      // First attempt with standard prompt
      let responseText = await this.callGeminiApi(imageData, INITIAL_PROMPT);
      let result = this.parseResponseText(responseText);

      // If the format is invalid, retry with clearer instructions
      if (result.error === 'Invalid response format from AI') {
        console.log(
          'Detected invalid format, retrying with clearer instructions'
        );
        responseText = await this.callGeminiApi(imageData, RETRY_PROMPT);
        result = this.parseResponseText(responseText);
      }

      if (!result.success) {
        throw new HTTPException(400, { message: result.error });
      }

      return {
        harmful_ingredients: result.harmful_ingredients,
      };
    } catch (error) {
      console.error('Error processing image parse request:', error);
      if (error instanceof HTTPException) {
        throw error;
      }
      throw new HTTPException(500, {
        message: 'Failed to parse image',
        cause: error,
      });
    }
  }

  /**
   * Calls the Gemini API to process an image.
   * @param imageData The image data as an ArrayBuffer.
   * @param prompt The text prompt.
   * @returns A promise resolving to the text response from the Gemini API.
   */
  private async callGeminiApi(
    imageData: ArrayBuffer,
    prompt: string
  ): Promise<string> {
    const apiKey = Deno.env.get('GOOGLE_API_KEY');
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY environment variable not set');
    }
    const model = 'gemini-2.0-flash-lite';
    const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Convert ArrayBuffer to base64 using Deno's encodeBase64 function
    const base64Image = encodeBase64(new Uint8Array(imageData));
    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: base64Image,
              },
            },
          ],
        },
      ],
    };

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Gemini API Error:', response.status, errorBody);
      throw new HTTPException(500, {
        message: `Gemini API error: ${response.statusText}`,
      });
    }

    const result = await response.json();

    const text = result.candidates[0].content.parts[0].text;
    console.log('text from ai: ', text);
    return text;
  }

  private parseResponseText(responseText: string): {
    success: boolean;
    error: string;
    harmful_ingredients: string[];
  } {
    try {
      // Clean the response text - remove markdown code block formatting if present
      let cleanedResponseText = responseText.trim();

      // Remove markdown code block format if present (```json ... ```)
      const codeBlockRegex = /^```(?:json)?\s*([\s\S]*?)```$/;
      const match = cleanedResponseText.match(codeBlockRegex);
      if (match && match[1]) {
        cleanedResponseText = match[1].trim();
      }

      console.log('Cleaned response for parsing:', cleanedResponseText);

      // Try to parse as JSON
      let parsedJson;
      try {
        parsedJson = JSON.parse(cleanedResponseText);
      } catch (e) {
        console.error('JSON parse error:', e);
        return {
          success: false,
          error: 'Invalid response format from AI',
          harmful_ingredients: [],
        };
      }

      // Validate the JSON structure
      if (!parsedJson || typeof parsedJson !== 'object') {
        console.error('Invalid JSON structure:', parsedJson);
        return {
          success: false,
          error: 'Invalid response format from AI',
          harmful_ingredients: [],
        };
      }

      const { status, message, harmful_ingredients } = parsedJson;

      // Check required fields
      if (status !== 'success' && status !== 'error') {
        console.error('Invalid status value:', status);
        return {
          success: false,
          error: 'Invalid response format from AI',
          harmful_ingredients: [],
        };
      }

      // For success, we need the extracted text (even if not explicitly in the JSON)
      const isSuccess = status === 'success';

      // If it's an error, return the error message
      if (!isSuccess && message) {
        return {
          success: false,
          error: message,
          harmful_ingredients: [],
        };
      }

      // For harmful ingredients, ensure it's an array
      const ingredients = Array.isArray(harmful_ingredients)
        ? harmful_ingredients
        : [];

      return {
        success: isSuccess,
        error: message || 'Unknown error',
        harmful_ingredients: ingredients,
      };
    } catch (e) {
      console.error('Unexpected error in parseResponseText:', e);
      return {
        success: false,
        error: 'Invalid response format from AI',
        harmful_ingredients: [],
      };
    }
  }
}
