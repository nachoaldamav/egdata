import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosError,
} from 'axios';

type ParameterValue = string | number | boolean | undefined | null;
interface FetchOptions extends AxiosRequestConfig {
  params?: Record<string, ParameterValue>;
  headers?: Record<string, string>;
  timeout?: number;
}

class HttpFetch {
  private axiosInstance: AxiosInstance;

  constructor(baseURL = '', defaultOptions: FetchOptions = {}) {
    this.axiosInstance = axios.create({
      baseURL,
      headers: defaultOptions.headers,
      timeout: defaultOptions.timeout ?? 10_000,
      withCredentials: defaultOptions.withCredentials ?? true,
    });
  }

  private handleAxiosError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const errorData = axiosError.response?.data;
      const status = axiosError.response?.status;
      const errorMessage = `HTTP error! Status: ${status ?? 'unknown'}`;

      const httpError = new Error(errorMessage);
      (httpError as any).response = errorData;
      (httpError as any).status = status;
      throw httpError;
    }
    throw error instanceof Error ? error : new Error('Unknown error occurred');
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public async retry<T>(
    requestFn: () => Promise<T>,
    { retries = 3, delay = 1000 }: { retries?: number; delay?: number } = {},
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        const status = (error as { status?: number }).status;
        if (status === 404 || attempt === retries) {
          throw lastError;
        }
        await this.delay(delay);
      }
    }

    throw lastError ?? new Error('Max retries reached');
  }

  public async get<T>(
    endpoint: string,
    options: FetchOptions = {},
  ): Promise<T> {
    try {
      const response = await this.axiosInstance.get<T>(endpoint, {
        params: options.params,
        headers: options.headers,
        timeout: options.timeout,
      });
      return response.data;
    } catch (error) {
      return this.handleAxiosError(error);
    }
  }

  // Similar pattern for other methods (post, put, patch, delete, options)
  public async post<T>(
    endpoint: string,
    body?: unknown,
    options: FetchOptions = {},
  ): Promise<T> {
    try {
      const response = await this.axiosInstance.post<T>(endpoint, body, {
        params: options.params,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        timeout: options.timeout,
      });
      return response.data;
    } catch (error) {
      return this.handleAxiosError(error);
    }
  }

  public async put<T>(
    endpoint: string,
    body?: unknown,
    options: FetchOptions = {},
  ): Promise<T> {
    try {
      const response = await this.axiosInstance.put<T>(endpoint, body, {
        params: options.params,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        timeout: options.timeout,
      });
      return response.data;
    } catch (error) {
      return this.handleAxiosError(error);
    }
  }

  public async patch<T>(
    endpoint: string,
    body?: unknown,
    options: FetchOptions = {},
  ): Promise<T> {
    try {
      const response = await this.axiosInstance.patch<T>(endpoint, body, {
        params: options.params,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        timeout: options.timeout,
      });
      return response.data;
    } catch (error) {
      return this.handleAxiosError(error);
    }
  }

  public async delete<T>(
    endpoint: string,
    options: FetchOptions = {},
  ): Promise<T> {
    try {
      const response = await this.axiosInstance.delete<T>(endpoint, {
        params: options.params,
        headers: options.headers,
        timeout: options.timeout,
      });
      return response.data;
    } catch (error) {
      return this.handleAxiosError(error);
    }
  }

  public async options<T>(
    endpoint: string,
    options: FetchOptions = {},
  ): Promise<T> {
    try {
      const response = await this.axiosInstance.options<T>(endpoint, {
        params: options.params,
        headers: options.headers,
        timeout: options.timeout,
      });
      return response.data;
    } catch (error) {
      return this.handleAxiosError(error);
    }
  }
}

export const httpClient = new HttpFetch(
  import.meta.env.SSR
    ? (process.env.SERVER_API_ENDPOINT ?? 'https://api-gcp.egdata.app')
    : (import.meta.env.SERVER_API_ENDPOINT ?? 'https://api-gcp.egdata.app'),
  {
    timeout: 5_000,
    withCredentials: true,
  },
);
