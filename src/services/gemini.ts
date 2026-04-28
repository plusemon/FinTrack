import { GoogleGenAI, Modality, Type } from "@google/genai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const getAI = () => {
  if (!API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured. Please add VITE_GEMINI_API_KEY to your .env file.");
  }
  return new GoogleGenAI({ apiKey: API_KEY });
};

export const isAIConfigured = () => !!API_KEY;

export const geminiService = {
  async chat(message: string, history: { role: "user" | "model"; parts: { text: string }[] }[]) {
    if (!isAIConfigured()) {
      throw new Error("AI service is not configured. Please set VITE_GEMINI_API_KEY in your environment.");
    }
    const ai = getAI();
    const chat = ai.chats.create({
      model: "gemini-2.0-flash",
      config: {
        systemInstruction: "You are FinTrack AI, a helpful financial assistant. You help users manage their transactions, budgets, and financial goals. You provide advice on saving, investing, and spending habits based on the data provided. Be professional, encouraging, and concise.",
      },
    });
    
    const response = await chat.sendMessage({ message });
    return response.text;
  },

  async generateImage(prompt: string, size: "1K" | "2K" | "4K" = "1K") {
    if (!isAIConfigured()) {
      throw new Error("AI service is not configured. Please set VITE_GEMINI_API_KEY in your environment.");
    }
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        responseModalities: ["image"],
      },
    });

    for (const part of response.candidates?.[0]?.content.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  },

  async textToSpeech(text: string) {
    if (!isAIConfigured()) {
      throw new Error("AI service is not configured. Please set VITE_GEMINI_API_KEY in your environment.");
    }
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return `data:audio/mp3;base64,${base64Audio}`;
    }
    throw new Error("No audio generated");
  },
};
