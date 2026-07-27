import { getApiUrl } from "../lib/api";

export interface AIProduct {
  id: string;
  slug?: string;
  name: string;
  image?: string;
  category?: string;
  price?: number;
  featured?: boolean;
  description?: string;
}

export interface AIResponse {
  answer: string;
  products: AIProduct[];
  showProducts?: boolean;
  followUpRequired?: boolean;
}

export async function chatWithAI(
  sessionId: string,
  message: string
): Promise<AIResponse> {
  const response = await fetch(getApiUrl("/api/ai/chat"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sessionId,
      message,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to communicate with AI.");
  }

  const result = await response.json();

  return result.data;
}