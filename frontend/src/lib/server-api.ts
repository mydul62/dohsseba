export const getServerApiBaseUrl = (): string => {
  const url = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5008/api/v1';
  return url.replace('localhost', '127.0.0.1');
};

export async function fetchServerApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; message?: string; data: T | null; meta?: any }> {
  const baseUrl = getServerApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    next: { revalidate: 60 },
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const res = await fetch(url, config);
    if (!res.ok) {
      return {
        success: false,
        message: `HTTP error ${res.status}`,
        data: null,
      };
    }
    const json = await res.json();
    return json;
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Server network error',
      data: null,
    };
  }
}
