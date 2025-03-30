/**
 * Test suite for the HealthService.
 * @module
 */

import {
  assertEquals,
  assertExists,
  assertMatch,
} from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { stub } from 'https://deno.land/std@0.224.0/testing/mock.ts';
import { HealthService, type HealthStatus } from './health.service.ts'; // Relative path

/**
 * Tests for the HealthService class.
 */
Deno.test('HealthService', async (t) => {
  let healthService: HealthService;

  /**
   * Test case for the getHealthStatus method when DENO_DEPLOYMENT_ID is not set.
   */
  await t.step(
    "getHealthStatus should return 'dev' version when env is not set",
    async () => {
      // Arrange
      healthService = new HealthService();
      // Mock Deno.env.get to simulate the env variable not being set
      const envStub = stub(
        Deno.env,
        'get',
        (key: string): string | undefined => {
          if (key === 'DENO_DEPLOYMENT_ID') return undefined;
          // Fallback to actual env.get might be risky if other env vars are needed
          // and not allowed. Explicitly return undefined for others if safer.
          return undefined;
        }
      );

      try {
        // Act
        const result: HealthStatus = await healthService.getHealthStatus();

        // Assert
        assertEquals(result.status, 'UP');
        assertMatch(
          result.timestamp,
          /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/
        ); // Check ISO 8601 format
        assertEquals(result.version, 'dev');
        assertExists(result.dependencies);
        assertEquals(result.dependencies?.exampleDependency, 'UP');
      } finally {
        // Restore original Deno.env.get
        envStub.restore();
      }
    }
  );

  /**
   * Test case for the getHealthStatus method when DENO_DEPLOYMENT_ID is set.
   */
  await t.step(
    'getHealthStatus should return deployment ID version when env is set',
    async () => {
      // Arrange
      healthService = new HealthService();
      const mockDeploymentId = 'deploy-123xyz';
      // Mock Deno.env.get to simulate the env variable being set
      const envStub = stub(
        Deno.env,
        'get',
        (key: string): string | undefined => {
          if (key === 'DENO_DEPLOYMENT_ID') return mockDeploymentId;
          return undefined;
        }
      );

      try {
        // Act
        const result: HealthStatus = await healthService.getHealthStatus();

        // Assert
        assertEquals(result.status, 'UP');
        assertExists(result.timestamp);
        assertEquals(result.version, mockDeploymentId);
        assertExists(result.dependencies);
        assertEquals(result.dependencies?.exampleDependency, 'UP');
      } finally {
        // Restore original Deno.env.get
        envStub.restore();
      }
    }
  );
});
