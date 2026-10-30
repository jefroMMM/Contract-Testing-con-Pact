import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { HttpClient, HttpError } from '../src/http-client.js';
import { ProductClient } from '../src/product-client.js';
import { listen, close } from '../src/provider.js';

async function withResponse(status: number, body: unknown, action: (client: ProductClient) => Promise<void>) {
  const server = createServer((_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(status).end(JSON.stringify(body));
  });
  const url = await listen(server);
  try { await action(new ProductClient(new HttpClient(url))); }
  finally { await close(server); }
}

test('un HTTP 500 no se interpreta como producto inexistente', async () => {
  await withResponse(500, { error: { code: 'INTERNAL_ERROR' } }, async client => {
    await assert.rejects(client.getProduct('p-100'), (e: unknown) => e instanceof HttpError && e.status === 500);
  });
});

test('un 404 de ruta equivocada no se interpreta como producto inexistente', async () => {
  await withResponse(404, { error: { code: 'ROUTE_NOT_FOUND', message: 'Ruta no encontrada' } }, async client => {
    await assert.rejects(client.getProduct('p-100'), HttpError);
  });
});

test('el consumidor rechaza price string y no convierte silenciosamente el tipo', async () => {
  await withResponse(200, { id: 'p-100', name: 'Teclado', price: '249.9', available: true }, async client => {
    await assert.rejects(client.getProduct('p-100'), /Respuesta de producto invalida/);
  });
});

test('el consumidor rechaza un producto con otro ID', async () => {
  await withResponse(200, { id: 'otro', name: 'Teclado', price: 249.9, available: true }, async client => {
    await assert.rejects(client.getProduct('p-100'), /Respuesta de producto invalida/);
  });
});
