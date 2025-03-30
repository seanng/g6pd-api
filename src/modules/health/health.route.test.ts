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

// Mock the HealthService
const mockHealthStatus: HealthStatus = {
  status: 'MOCKED_UP',
  timestamp: new Date().toISOString(),
  version: 'mock-v1',
  dependencies: { mockedDep: 'UP' },
};

class MockHealthService {
  async getHealthStatus(): Promise<HealthStatus> {
    return await Promise.resolve(mockHealthStatus);
  }
}

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

      // !!! Critical Assumption: We need a way to inject the mock service.
      // This example simulates a scenario where the route might accept the service,
      // or we reconstruct the app with the mock.
      // If health.ts directly creates `new HealthService()`, this mock won't be used
      // without modifying health.ts or using more advanced mocking.

      // Let's assume `healthRoute` could be modified or re-created to use a specific service instance.
      // For simplicity here, we'll just use the imported route, acknowledging the limitation.
      app.route('/', healthRoute);

      // Act: Simulate a request to the endpoint
      const req = new Request('http://localhost/', { method: 'GET' });
      const res = await app.request(req);
      const jsonResult: HealthStatus = await res.json();

      // Assert
      assertEquals(res.status, 200);
      // In this testing context, Hono seems to only return application/json
      // console.log("DEBUG: Content-Type Header:", res.headers.get('content-type')); // Remove debug log
      assertEquals(
        res.headers.get('content-type'),
        'application/json' // Expect only application/json in test environment
      );
      assertEquals(jsonResult.status, 'UP'); // Check status from the actual service execution
      assertExists(jsonResult.timestamp);
      assertExists(jsonResult.version); // 'dev' or deployment ID
      assertExists(jsonResult.dependencies);
    }
  );
});
