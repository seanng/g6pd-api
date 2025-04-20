/**
 * Test suite for the health check route.
 * @module
 */

import {
  assertEquals,
  assertInstanceOf,
  assertExists,
} from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { Hono } from 'hono';
import { healthRoute } from './health.route.ts';
import { HealthService, type HealthStatus } from './health.service.ts';
import { stub } from 'https://deno.land/std@0.224.0/testing/mock.ts';

// Mock the dependency injection or replace the service instance used by the route
// NOTE: This is a simplified mock strategy. Depending on how HealthService
// is instantiated and used in health.ts, you might need a more sophisticated
// mocking approach (e.g., using std/testing/mock or dependency injection).
// For this example, we assume we can inject/replace it directly or the route
// somehow uses an injectable instance.

// A simplified way assuming we can re-construct the app/route with the mock
// This might require adjusting health.ts if the service instance is hardcoded.
// A more robust way would involve true dependency injection or mocking tools.

/**
 * Tests for the health check route.
 */
Deno.test('Health Route', async (t) => {
  /**
   * Test case for GET /health endpoint.
   */
  await t.step(
    'GET / should return JSON health status from mocked service',
    async () => {
      // Arrange
      const app = new Hono();
      // Stub Deno.env.get to avoid needing --allow-env
      const envStub = stub(
        Deno.env,
        'get',
        (key: string): string | undefined => {
          if (key === 'DENO_DEPLOYMENT_ID') return undefined; // or return a mock value if desired
          return undefined;
        }
      );
      try {
        app.route('/', healthRoute);
        // Act: Simulate a request to the endpoint
        const req = new Request('http://localhost/', { method: 'GET' });
        const res = await app.request(req);
        const jsonResult: HealthStatus = await res.json();
        // Assert
        assertEquals(res.status, 200);
        assertEquals(
          res.headers.get('content-type'),
          'application/json' // Expect only application/json in test environment
        );
        assertEquals(jsonResult.status, 'UP'); // Check status from the actual service execution
        assertExists(jsonResult.timestamp);
        assertExists(jsonResult.version); // 'dev' or deployment ID
        assertExists(jsonResult.dependencies);
      } finally {
        envStub.restore();
      }
    }
  );
});
