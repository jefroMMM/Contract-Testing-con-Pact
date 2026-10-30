import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ProductRepository, sampleProduct } from '../src/product.js';
import { createProductServer, listen, close } from '../src/provider.js';
import { HttpClient } from '../src/http-client.js';
import { ProductClient } from '../src/product-client.js';

test('HTTP real y cliente real: estados completos independientes en ambos ordenes', async () => {
  const repository = new ProductRepository();
  const server = createProductServer(repository);
  const client = new ProductClient(new HttpClient(await listen(server)));
  try {
    for (const states of [[false, true], [true, false]]) {
      for (const exists of states) {
        repository.reset(exists ? [sampleProduct] : []);
        const result = await client.getProduct('p-100');
        assert.equal(result.kind, exists ? 'found' : 'not-found');
      }
    }
  } finally { await close(server); }
});
