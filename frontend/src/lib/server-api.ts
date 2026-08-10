export const getServerApiBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (process.env.INTERNAL_API_URL) {
    return process.env.INTERNAL_API_URL;
  }
  return 'http://localhost:5000/api/v1';
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
    console.error(`[fetchServerApi Error] Endpoint: ${endpoint}`, error?.message || error);
    return {
      success: false,
      message: error?.message || 'Server network error',
      data: null,
    };
  }
}
