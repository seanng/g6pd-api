# G6PD API (Hono)

This is a sample API built with Hono and Deno, structured similarly to NestJS principles.

## Project Structure

```
.
├── deno.json
├── deno.lock
├── README.md
└── src
    ├── main.ts         # Main application entry point
    ├── routes          # Contains route definitions
    │   └── hello.route.ts
    └── services        # Contains business logic/services
        └── hello.service.ts
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
- `GET /hello`: Returns "Hello from Service!"
