import { Hono } from 'hono';
import { HealthService } from './health.service.ts';

/**
 * Hono router instance for handling health check requests.
 */
const healthRoute = new Hono();

/**
 * Instance of the HealthService used by the health route.
 */
const healthService = new HealthService();

/**
 * Defines the GET / endpoint for the health check.
 * Retrieves the application's health status from the HealthService
 * and returns it as a JSON response.
 */
healthRoute.get('/', async (c) => {
  const healthStatus = await healthService.getHealthStatus();
  return c.json(healthStatus);
});

export { healthRoute };
