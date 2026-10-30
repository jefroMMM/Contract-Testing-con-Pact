import { ProductRepository, sampleProduct } from './product.js';
import { createProductServer, listen } from './provider.js';

const port = Number(process.env.PORT ?? 3000);
const server = createProductServer(new ProductRepository([sampleProduct]));
console.log(`API de productos: ${await listen(server, port)}`);
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => { server.close(); server.closeIdleConnections(); });
}
