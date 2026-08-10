"use server";

import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";

const getApiBaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api/v1";
  return url.replace("localhost", "127.0.0.1");
};

export const GetFullHomepagePublic = async () => {
  try {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/homepage/full`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      next: {
        tags: ["homepage"],
        revalidate: 60,
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching homepage data:", error);
    return null;
  }
};
