import { HttpClient } from './http-client.js';
import { ProductClient } from './product-client.js';

try {
  const client = new ProductClient(new HttpClient(process.env.API_URL ?? 'http://127.0.0.1:3000'));
  const result = await client.getProduct(process.argv[2] ?? 'p-100');
  console.log(result.kind === 'found'
    ? `${result.product.name}: Q${result.product.price.toFixed(2)} - disponible: ${result.product.available}`
    : result.message);
} catch (error) {
  console.error('No fue posible consultar el producto:', error);
  process.exitCode = 1;
}
