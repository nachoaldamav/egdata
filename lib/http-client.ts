interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
  timeout?: number;
}

class HttpFetch {
  private baseURL: string;
  private defaultOptions: FetchOptions;

  constructor(baseURL = '', defaultOptions: FetchOptions = {}) {
    this.baseURL = baseURL;
    this.defaultOptions = defaultOptions;
  }

  private async request<T>(
    endpoint: string,
    options: FetchOptions = {},
  ): Promise<T> {
    const url = new URL(`${this.baseURL}${endpoint}`);

    const finalOptions: FetchOptions = {
      ...this.defaultOptions,
      ...options,
      headers: {
        ...this.defaultOptions.headers,
        ...options.headers,
      },
      timeout: options.timeout || this.defaultOptions.timeout || 5000,
    };

    if (finalOptions.params) {
      for (const [key, value] of Object.entries(finalOptions.params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      }
      delete finalOptions.params;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      finalOptions.timeout,
    );
    const response = await fetch(url.toString(), {
      ...finalOptions,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData: any;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: 'Failed to parse error response as JSON' };
      }
      const error: any = new Error(`HTTP error! Status: ${response.status}`);
      error.response = errorData;
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    return data as T;
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public async retry<T>(
    fetchMethod: () => Promise<T>,
    { retries = 3, delay = 1000 }: { retries?: number; delay?: number } = {},
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await fetchMethod();
      } catch (error) {
        lastError = error;

        // If status is 404 or it's the last attempt, don't retry
        if ((error as any).status === 404 || attempt === retries) {
          throw lastError;
        }

        await this.delay(delay);
      }
    }

    throw lastError || new Error('Max retries reached');
  }

  public get<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T>(
    endpoint: string,
    body: unknown,
    options: FetchOptions = {},
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(body),
    });
  }

  public put<T>(
    endpoint: string,
    body: unknown,
    options: FetchOptions = {},
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(body),
    });
  }

  public options<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'OPTIONS' });
  }

  public delete<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  public patch<T>(
    endpoint: string,
    body: unknown,
    options: FetchOptions = {},
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(body),
    });
  }
}

export const httpClient = new HttpFetch(
  import.meta.env.SSR
    ? (process.env.SERVER_API_ENDPOINT ?? 'https://api.egdata.app')
    : (import.meta.env.SERVER_API_ENDPOINT ?? 'https://lb-api.egdata.app'),
  {
    headers: {
      // @ts-expect-error
      'User-Agent': import.meta.env.SSR
        ? 'egdata.app/0.0.1 (https://egdata.app)'
        : undefined,
    },
    timeout: 5000,
  },
);
