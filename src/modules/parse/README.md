# Parse Module

Handles image uploads and forwards them along with a prompt to the Google AI Gemini API for analysis.

## Endpoints

- `POST /` - Accepts multipart/form-data with an `image` file and a `prompt` string.
