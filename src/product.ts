export interface Product {
  id: string;
  name: string;
  price: number;
  available: boolean;
}

export const sampleProduct: Product = {
  id: 'p-100', name: 'Teclado mecanico', price: 249.9, available: true,
};

export class ProductRepository {
  private products = new Map<string, Product>();

  constructor(products: Product[] = []) { this.reset(products); }

  reset(products: Product[]): void {
    this.products = new Map(products.map(product => [product.id, { ...product }]));
  }

  findById(id: string): Product | undefined {
    const product = this.products.get(id);
    return product ? { ...product } : undefined;
  }
}
