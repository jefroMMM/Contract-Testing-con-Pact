import { HttpClient, HttpError } from './http-client.js';
import type { Product } from './product.js';

export type ProductResult =
  | { kind: 'found'; product: Product }
  | { kind: 'not-found'; message: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isProduct(value: unknown): value is Product {
  return isRecord(value) && typeof value.id === 'string' &&
    typeof value.name === 'string' && typeof value.price === 'number' &&
    Number.isFinite(value.price) && typeof value.available === 'boolean';
}

export class ProductClient {
  constructor(private readonly http: HttpClient) {}

  async getProduct(id: string): Promise<ProductResult> {
    try {
      const body = await this.http.get(`/products/${encodeURIComponent(id)}`);
      if (!isProduct(body) || body.id !== id) throw new Error('Respuesta de producto invalida');
      return { kind: 'found', product: body };
    } catch (error) {
      if (error instanceof HttpError && error.status === 404 &&
          isRecord(error.body) && isRecord(error.body.error) &&
          error.body.error.code === 'PRODUCT_NOT_FOUND' &&
          typeof error.body.error.message === 'string') {
        return { kind: 'not-found', message: error.body.error.message };
      }
      throw error;
    }
  }
}
