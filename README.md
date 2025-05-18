# G6PD API (Hono)

This is a sample API built with Hono and Deno, structured similarly to NestJS principles.

## Getting Started

### Prerequisites

- [Deno](https://deno.land/)

### Installation & Running

1.  **Clone the repository:**

    ```bash
    git clone <your-repo-url>
    cd g6pd-api
    ```

2.  **Run the development server:**
    The necessary dependencies will be downloaded automatically when you run the application.
    ```bash
    deno task start
    ```
    The server will start on `http://localhost:8000`.

## Available Routes

- `GET /`: Returns "Welcome to the API!"
- `GET /health`: Returns a JSON object with the application's health status, including timestamp, version (deployment ID on Deno Deploy), and dependency status. Example response:

  ```json
  {
    "status": "UP",
    "timestamp": "2023-11-01T12:00:00.000Z",
    "version": "deployment-id-or-dev",
    "dependencies": {
      "exampleDependency": "UP"
    }
  }
  ```

- `POST /parse`: Parses text from an uploaded image, primarily for ingredient labels. Leverages the Gemini API.
  - **Request:**
    - Method: `POST`
    - Endpoint: `/parse`
    - Content Type: `multipart/form-data`
    - Body:
      - `image`: A file upload containing the image.
        - Supported formats: JPEG, PNG, WebP
        - Maximum size: 10MB
  - **Response (Success - 200 OK):**
    ```json
    {
      "success": true,
      "data": {
        "harmful_ingredients": ["Ingredient1", "Ingredient2"],
        "original_text": "Ingredientes: agua, Ingrediente1, Ingrediente2, sal",
        "translated_text": "Ingredients: water, Ingredient1, Ingredient2, salt"
      }
    }
    ```
  - **Response (Client Error - 400 Bad Request):**
    Returned for invalid input, such as missing `image` field, unsupported file type, or exceeding file size limit.
    ```json
    {
      "success": false,
      "message": "[Error description, e.g., validation error message]"
    }
    ```
  - **Response (Server Error - 500 Internal Server Error):**
    Returned for errors during image processing or interaction with the parsing service/Gemini API.
    ```json
    {
      "success": false,
      "message": "Internal Server Error"
    }
    ```

## Architecture

This API is built using **Hono**, a lightweight and fast web framework for Deno, Cloudflare Workers, and other edge runtimes. It leverages **Deno** as the runtime environment, providing a secure and efficient platform. The project is written in **TypeScript**, ensuring type safety and developer productivity.

The architecture follows principles inspired by **NestJS**, organizing the codebase into **modules**. Each module encapsulates related logic, including:

- **Routes:** Handle incoming requests and define API endpoints.
- **Services:** Contain the business logic and interact with data sources or other dependencies.
- **Tests:** Ensure the functionality of routes and services.

The application's entry point is `src/main.ts`, which sets up the Hono application and registers the different feature modules.

### Project Structure

```
.
├── deno.json
├── deno.lock
├── README.md
├── docs/
│   └── README.md     # Entry point for detailed documentation
└── src/
    ├── main.ts         # Main application entry point
    └── modules/        # Feature modules directory
        └── health/     # Health check module
            ├── health.route.ts
            ├── health.route.test.ts
            ├── health.service.ts
            └── health.service.test.ts
```
