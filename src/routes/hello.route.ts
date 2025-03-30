import { Hono } from 'hono';
import { HelloService } from '../services/hello.service.ts';

const helloRoute = new Hono();
const helloService = new HelloService();

helloRoute.get('/', (c) => {
  const message = helloService.getHello();
  return c.text(message);
});

export { helloRoute };
