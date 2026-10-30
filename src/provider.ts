import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { ProductRepository } from './product.js';

export function createProductServer(repository: ProductRepository,
  options: { incompatiblePrice?: boolean } = {}): Server {
  return createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://localhost');
    const match = /^\/products\/([^/]+)$/.exec(url.pathname);
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    if (request.method !== 'GET' || !match?.[1]) {
      response.writeHead(404).end(JSON.stringify({ error: { code: 'ROUTE_NOT_FOUND', message: 'Ruta no encontrada' } }));
      return;
    }
    let id: string;
    try { id = decodeURIComponent(match[1]); }
    catch { response.writeHead(400).end(JSON.stringify({ error: { code: 'INVALID_ID', message: 'ID invalido' } })); return; }
    const product = repository.findById(id);
    if (!product) {
      response.writeHead(404).end(JSON.stringify({ error: {
        code: 'PRODUCT_NOT_FOUND', message: `El producto ${id} no existe`,
      } }));
      return;
    }
    // Mutacion exclusivamente para la demostracion: nunca se activa en server.ts.
    const body = options.incompatiblePrice ? { ...product, price: String(product.price) } : product;
    response.writeHead(200).end(JSON.stringify(body));
  });
}

export async function listen(server: Server, port = 0): Promise<string> {
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => { server.removeListener('error', reject); resolve(); });
  });
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

export async function close(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
    server.closeIdleConnections();
  });
}
