import { Hono } from 'hono';
import { HealthService } from './health.service.ts';

/**
 * Hono router instance for handling health check requests.
 */
const healthRoute = new Hono();

const healthService = new HealthService();

healthRoute.get('/', async (c) => {
  const healthStatus = await healthService.getHealthStatus();
  return c.json(healthStatus);
});

export { healthRoute };
