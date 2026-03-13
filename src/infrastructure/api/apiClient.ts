import { Platform } from 'react-native';

export interface ApiClientConfig {
  baseUrl: string;
  defaultHeaders?: Record<string, string>;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiRequestOptions<TBody = unknown> {
  method?: HttpMethod;
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: TBody;
  headers?: Record<string, string>;
}

export interface ApiResponse<TData = unknown> {
  ok: boolean;
  status: number;
  data: TData | null;
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly defaultHeaders: Record<string, string>;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.defaultHeaders = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Platform': Platform.OS,
      ...config.defaultHeaders,
    };
  }

  async request<TData = unknown, TBody = unknown>(
    options: ApiRequestOptions<TBody>,
  ): Promise<ApiResponse<TData>> {
    const url = this.buildUrl(options.path, options.query);

    const response = await fetch(url, {
      method: options.method ?? 'GET',
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
      body:
        options.body != null
          ? (this.defaultHeaders['Content-Type'] === 'application/json'
              ? JSON.stringify(options.body)
              : (options.body as unknown as BodyInit))
          : undefined,
    });

    let data: TData | null = null;

    const contentType = response.headers.get('Content-Type') ?? '';
    if (contentType.includes('application/json')) {
      data = (await response.json()) as TData;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data = (await response.text()) as any;
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  }

  private buildUrl(path: string, query?: ApiRequestOptions['query']): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(this.baseUrl + normalizedPath);

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }
}

export const apiClient = new ApiClient({
  baseUrl: 'https://api.example.com', // replace with environment-specific base URL
});

