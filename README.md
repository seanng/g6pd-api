# G6PD API (Hono)

This is a sample API built with Hono and Deno, structured similarly to NestJS principles.

## Project Structure

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
