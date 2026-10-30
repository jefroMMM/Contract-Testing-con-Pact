import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import { HttpClient } from '../src/http-client.js';
import { ProductClient } from '../src/product-client.js';
import { sampleProduct } from '../src/product.js';

const { string, decimal, boolean } = MatchersV3;
const pact = new PactV3({
  consumer: 'ProductConsumer', provider: 'ProductProvider',
  dir: resolve('pacts'), logLevel: 'error',
});

test('producto existente: cliente real interpreta HTTP 200 y sus tipos', async () => {
  pact.given('existe el producto p-100')
    .uponReceiving('consultar el producto p-100')
    .withRequest({ method: 'GET', path: '/products/p-100', headers: { Accept: 'application/json' } })
    .willRespondWith({ status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: { id: 'p-100', name: string('Teclado mecanico'), price: decimal(249.9), available: boolean(true) },
    });
  await pact.executeTest(async mock => {
    const client = new ProductClient(new HttpClient(mock.url));
    assert.deepEqual(await client.getProduct('p-100'), { kind: 'found', product: sampleProduct });
  });
});

test('producto inexistente: cliente real distingue HTTP 404 estructurado', async () => {
  pact.given('no existe el producto p-404')
    .uponReceiving('consultar el producto p-404')
    .withRequest({ method: 'GET', path: '/products/p-404', headers: { Accept: 'application/json' } })
    .willRespondWith({ status: 404, headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: { error: { code: 'PRODUCT_NOT_FOUND', message: string('El producto p-404 no existe') } },
    });
  await pact.executeTest(async mock => {
    const client = new ProductClient(new HttpClient(mock.url));
    assert.deepEqual(await client.getProduct('p-404'), { kind: 'not-found', message: 'El producto p-404 no existe' });
  });
});
