import { useAuthStore } from '@/store/useAuthStore';

export const getApiBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${origin}/api/v1`;
    }
  }
  return 'http://localhost:5000/api/v1';
};

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

let isRefreshing = false;

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; message: string; data: T; meta?: any }> {
  let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token && typeof window !== 'undefined') {
    try {
      const authStr = localStorage.getItem('auth-storage');
      if (authStr) {
        const parsed = JSON.parse(authStr);
        token = parsed?.state?.token || null;
      }
    } catch (_) {}
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  };

  try {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}${endpoint}`, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // Automatic Token Refresh & Session Cleanup on 401 Unauthorized
      if (response.status === 401) {
        const isAuthEndpoint = endpoint === '/auth/login' || endpoint === '/auth/register' || endpoint === '/auth/refresh';
        
        if (!isAuthEndpoint && !isRefreshing) {
          isRefreshing = true;
          try {
            const storedRefreshToken = typeof window !== 'undefined'
              ? (localStorage.getItem('refreshToken') || document.cookie.match(/(?:^|; )refreshToken=([^;]+)/)?.[1])
              : null;

            const refreshRes = await fetch(`${baseUrl}/auth/refresh`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken: storedRefreshToken }),
            }).catch(() => null);

            if (refreshRes && refreshRes.ok) {
              const refreshData = await refreshRes.json();
              const newAccessToken = refreshData.data?.accessToken;
              const newRefreshToken = refreshData.data?.refreshToken;

              if (newAccessToken) {
                if (typeof window !== 'undefined') {
                  localStorage.setItem('token', newAccessToken);
                  document.cookie = `token=${newAccessToken}; path=/; max-age=604800; SameSite=Lax`;
                  if (newRefreshToken) {
                    localStorage.setItem('refreshToken', newRefreshToken);
                    document.cookie = `refreshToken=${newRefreshToken}; path=/; max-age=2592000; SameSite=Lax`;
                  }
                }
                isRefreshing = false;
                // Retry original request with new access token
                return fetchApi<T>(endpoint, {
                  ...options,
                  headers: {
                    ...options.headers,
                    Authorization: `Bearer ${newAccessToken}`,
                  },
                });
              }
            }
          } catch (_) {}
          isRefreshing = false;
        }

        // If refresh fails or user's session is completely invalid/expired: Logout & redirect (only if user had a token)
        if (!isAuthEndpoint && typeof window !== 'undefined' && token) {
          useAuthStore.getState().logout();
          if (!window.location.pathname.startsWith('/login')) {
            window.location.href = '/login?session_expired=true';
          }
        }
      }

      throw new ApiError(data.message || 'An error occurred', response.status, data);
    }

    return data;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error?.message || 'Network request failed. Is backend running?', 500);
  }
}

export async function uploadSingleImageApi(file: File): Promise<string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const formData = new FormData();
  formData.append('image', file);

  const headers: HeadersInit = {
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/upload/single`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new ApiError(data.message || 'Image upload failed', response.status, data);
  }
  return data.data?.url || data.url;
}

export async function uploadMultipleImagesApi(files: FileList | File[]): Promise<string[]> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const formData = new FormData();
  Array.from(files).forEach((file) => formData.append('images', file));

  const headers: HeadersInit = {
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/upload/multiple`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new ApiError(data.message || 'Image upload failed', response.status, data);
  }
  return data.data?.urls || data.urls || [];
}
