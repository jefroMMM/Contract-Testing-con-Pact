import { resolve } from 'node:path';
import { Verifier } from '@pact-foundation/pact';
import { ProductRepository, sampleProduct } from '../src/product.js';
import { createProductServer, listen, close } from '../src/provider.js';

const incompatible = process.argv.includes('--incompatible');
const repository = new ProductRepository();
const server = createProductServer(repository, { incompatiblePrice: incompatible });
const baseUrl = await listen(server);
console.log(`Proveedor real: ${baseUrl}; price=${incompatible ? 'string (INCOMPATIBLE)' : 'number (COMPATIBLE)'}`);
try {
  await new Verifier({
    provider: 'ProductProvider', providerBaseUrl: baseUrl,
    pactUrls: [resolve('pacts/ProductConsumer-ProductProvider.json')],
    providerVersion: '1.0.0', publishVerificationResult: false, logLevel: 'error',
    // Cada estado reemplaza todo el repositorio; no depende de la interaccion anterior.
    stateHandlers: {
      'existe el producto p-100': async () => { repository.reset([sampleProduct]); },
      'no existe el producto p-404': async () => { repository.reset([]); },
    },
  }).verifyProvider();
  console.log('VERIFICACION EXITOSA: las dos interacciones cumplen el contrato.');
} catch (error) {
  console.error('VERIFICACION FALLIDA:', error);
  process.exitCode = 1;
} finally { await close(server); }
