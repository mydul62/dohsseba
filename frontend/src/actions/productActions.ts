"use server";

import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";

const getApiBaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api/v1";
  return url.replace("localhost", "127.0.0.1");
};

// ─── Public Product Data Actions ─────────────────────────────────────────────

export const GetAllProductsPublic = async (queryString: string = "") => {
  try {
    const baseUrl = getApiBaseUrl();
    const query = queryString ? (queryString.startsWith("?") ? queryString : `?${queryString}`) : "";
    const response = await fetch(`${baseUrl}/products${query}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      next: {
        tags: ["products"],
        revalidate: 60,
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching public products:", error);
    return null;
  }
};

export const GetProductBySlugPublic = async (slug: string) => {
  try {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/products/${encodeURIComponent(slug)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      next: {
        tags: ["product", slug],
        revalidate: 60,
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching product details by slug:", error);
    return null;
  }
};

// ─── Protected Product Actions with Revalidation ─────────────────────────────

export const DeleteProductAction = async (id: string) => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value || "";
    const baseUrl = getApiBaseUrl();

    const response = await fetch(`${baseUrl}/products/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : "",
      },
    });

    revalidateTag("products");
    return await response.json();
  } catch (error) {
    console.error("Error deleting product:", error);
    return null;
  }
};

export const BulkDeleteProductsAction = async (ids: string[]) => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value || "";
    const baseUrl = getApiBaseUrl();

    const response = await fetch(`${baseUrl}/products/bulk-delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify({ ids }),
    });

    revalidateTag("products");
    return await response.json();
  } catch (error) {
    console.error("Error bulk deleting products:", error);
    return null;
  }
};
