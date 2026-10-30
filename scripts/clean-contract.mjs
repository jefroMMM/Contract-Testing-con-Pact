import { rm, mkdir } from 'node:fs/promises';
await mkdir('pacts', { recursive: true });
await rm('pacts/ProductConsumer-ProductProvider.json', { force: true });
