interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
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

  private async request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
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
        url.searchParams.append(key, String(value));
      }

      // biome-ignore lint/performance/noDelete: This is necessary to avoid sending the params in the body
      delete finalOptions.params;
    }

    return this.fetchWithRetries<T>(url.toString(), finalOptions);
  }

  private async fetchWithRetries<T>(url: string, options: FetchOptions): Promise<T> {
    let attempts = 0;
    while (attempts < options.retries!) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout);
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        return data as T;
      } catch (error) {
        if (attempts < options.retries! - 1) {
          await this.delay(options.retryDelay!);
        } else {
          throw error;
        }
      }
      attempts++;
    }
    throw new Error('Max retries reached');
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public get<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T>(endpoint: string, body: unknown, options: FetchOptions = {}): Promise<T> {
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

  public put<T>(endpoint: string, body: unknown, options: FetchOptions = {}): Promise<T> {
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

  public delete<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const httpClient = new HttpFetch(
  import.meta.env.SSR
    ? process.env.SERVER_API_ENDPOINT ?? 'https://api.egdata.app'
    : 'https://api.egdata.app',
  {
    headers: {
      // @ts-expect-error
      'User-Agent': import.meta.env.SSR ? 'egdata.app/0.0.1 (https://egdata.app)' : undefined,
    },
    retries: 3,
    retryDelay: 1000,
    timeout: 5000,
  },
);
