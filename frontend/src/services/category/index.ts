import { cookies } from "next/headers";

const getApiBaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api/v1";
  return url.replace("localhost", "127.0.0.1");
};

export const GetAllProductCategories = async () => {
  try {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/product-categories`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      next: {
        revalidate: 60,
        tags: ["product-categories"],
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("GetAllProductCategories error:", error);
    return null;
  }
};

export const GetCategoryBySlug = async (slug: string) => {
  try {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/product-categories/slug/${encodeURIComponent(slug)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      next: {
        revalidate: 60,
        tags: ["category", slug],
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("GetCategoryBySlug error:", error);
    return null;
  }
};
