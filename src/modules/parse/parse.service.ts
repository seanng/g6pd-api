import { HTTPException } from 'hono/http-exception';
import { encodeBase64 } from 'https://deno.land/std@0.224.0/encoding/base64.ts';

const PROMPT = `
You are an intelligent image parser that extracts text from an image consisting of an ingredient label. You are able to support multiple languages.

You must strictly follow this exact format in your response:
success
---
[empty line if success, or error message if error]
---
[parsed text]

DO NOT include any explanations, annotations, or additional text.

- The first line must be either "success" or "error". It would only be "success" if none of the "Error Conditions" are met.
- The second line must be exactly "---" (three hyphens).
- The third line must be the error message if first line is "error", or must be blank if first line is "success".
- The fourth line must be exactly "---" (three hyphens).
- The fifth line and beyond must contain the parsed text from the ingredient label.

Error Conditions:
- There is no text in the image
- Unable to identify an "ingredients section"
- Able to identify an "ingredients section", but the section is cut off
- Text is too blurry
- Unsupported language
`;

const RETRY_PROMPT = `
Your previous response did not follow the required format. Please respond EXACTLY as instructed:

success
---
[empty line if success, or error message if error]
---
[parsed text]

The format must have:
1. First line: "success" or "error"
2. Second line: "---" (three hyphens)
3. Third line: Error message or blank line
4. Fourth line: "---" (three hyphens)
5. Fifth line and beyond: Extracted text from the ingredient label

DO NOT include any explanations, annotations, or additional formatting.
`;

/**
 * Service responsible for handling image parsing requests via Gemini API.
 */
export class ParseService {
  /**
   * Placeholder for Google AI API interaction.
   *
   * NOTE: You will need to implement the actual API call using fetch or a library like @google/generative-ai.
   * Ensure you handle API keys securely (e.g., via environment variables).
   *
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
    return text;
  }

  /**
   * Processes an image and prompt by sending them to the Gemini API.
   * @param image The image to parse.
   * @returns A promise resolving to the text response from the Gemini API.
   */
  async processImage(image: File | FormDataEntryValue): Promise<string> {
    if (!image || !(image instanceof File)) {
      throw new HTTPException(400, { message: 'Image file is required' });
    }

    try {
      const imageData = await image.arrayBuffer();
      // First attempt with standard prompt
      let responseText = await this.callGeminiApi(imageData, PROMPT);
      let result = this.parseResponseText(responseText);

      // If the format is invalid, retry with clearer instructions
      if (result.error === 'Invalid response format from AI') {
        console.log(
          'Detected invalid format, retrying with clearer instructions'
        );
        responseText = await this.callGeminiApi(
          imageData,
          PROMPT + RETRY_PROMPT
        );
        result = this.parseResponseText(responseText);
      }

      if (!result.success) {
        throw new HTTPException(400, { message: result.error });
      }

      return result.text;
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

  private parseResponseText(responseText: string): {
    success: boolean;
    error: string;
    text: string;
  } {
    const sections = responseText.split('---');
    if (sections.length < 3) {
      return {
        success: false,
        error: 'Invalid response format from AI',
        text: '',
      };
    }

    const statusLine = sections[0].trim();
    const isSuccess = statusLine === 'success';
    const error = sections[1].trim();
    const text = sections[2].trim();

    return {
      success: isSuccess,
      error: error || 'Unknown error',
      text,
    };
  }
}
