interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
  retries?: number;
  retryDelay?: number;
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
      retries: options.retries || this.defaultOptions.retries || 3,
      retryDelay: options.retryDelay || this.defaultOptions.retryDelay || 1000,
      timeout: options.timeout || this.defaultOptions.timeout || 5000,
    };

    if (finalOptions.params) {
      for (const [key, value] of Object.entries(finalOptions.params)) {
        if (value === undefined || value === null) {
          continue;
        }
        url.searchParams.append(key, String(value));
      }

      // biome-ignore lint/performance/noDelete: This is necessary to avoid sending the params in the body
      delete finalOptions.params;
    }

    return this.fetchWithRetries<T>(url.toString(), finalOptions);
  }

  private async fetchWithRetries<T>(
    url: string,
    options: FetchOptions,
  ): Promise<T> {
    const maxAttempts = options.retries!;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout);
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          return data as T;
        }

        // Not OK response
        let errorData: any;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: 'Failed to parse error response as JSON' };
        }
        const error: any = new Error(`HTTP error! Status: ${response.status}`);
        error.response = errorData;
        error.status = response.status;

        // If status is 404, do not retry
        if (response.status === 404) {
          throw error;
        }

        if (attempt === maxAttempts) {
          // Last attempt, throw error
          throw error;
        }

        await this.delay(options.retryDelay!);
      } catch (error) {
        // Handle fetch/network errors
        if (attempt === maxAttempts) {
          throw error;
        } else {
          await this.delay(options.retryDelay!);
        }
      }
    }
    throw new Error('Max retries reached');
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
    : 'https://api.egdata.app',
  {
    headers: {
      // @ts-expect-error
      'User-Agent': import.meta.env.SSR
        ? 'egdata.app/0.0.1 (https://egdata.app)'
        : undefined,
    },
    retries: 3,
    retryDelay: 1000,
    timeout: 5000,
  },
);
