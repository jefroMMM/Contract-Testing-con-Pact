export class HttpError extends Error {
  constructor(public readonly status: number, public readonly body: unknown) {
    super(`HTTP ${status}`);
    this.name = 'HttpError';
  }
}

/** Cliente HTTP reutilizable. Los fallos de red conservan su error original. */
export class HttpClient {
  constructor(private readonly baseUrl: string) {}

  async get(path: string): Promise<unknown> {
    const response = await fetch(new URL(path, this.baseUrl), {
      headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(5000),
    });
    const body: unknown = await response.json();
    if (!response.ok) throw new HttpError(response.status, body);
    return body;
  }
}
