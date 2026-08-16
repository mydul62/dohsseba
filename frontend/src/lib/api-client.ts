import { useAuthStore } from '@/store/useAuthStore';

export const getApiBaseUrl = (): string => {
  if (typeof window === 'undefined' && process.env.INTERNAL_API_URL) {
    return process.env.INTERNAL_API_URL;
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${origin}/api/v1`;
    }
  }
  return 'http://localhost:5008/api/v1';
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

/**
 * Compresses an image on the client side before uploading to prevent Nginx 413 Payload Too Large / Failed to fetch errors.
 */
async function compressImageClientSide(file: File): Promise<File> {
  if (typeof window === 'undefined' || !file || file.size <= 400 * 1024 || !file.type.startsWith('image/')) {
    return file;
  }
  if (file.type.includes('svg') || file.type.includes('gif')) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const MAX_DIM = 1600;
      let width = img.width;
      let height = img.height;

      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(file);

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file);
          const name = file.name.replace(/\.[^/.]+$/, '.jpg');
          const compressedFile = new File([blob], name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        'image/jpeg',
        0.85
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

export async function uploadSingleImageApi(file: File): Promise<string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const compressedFile = await compressImageClientSide(file);
  const formData = new FormData();
  formData.append('image', compressedFile);

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
  const fileArray = Array.from(files);
  const compressedFiles = await Promise.all(fileArray.map((f) => compressImageClientSide(f)));

  const formData = new FormData();
  compressedFiles.forEach((file) => formData.append('images', file));

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
