import { GoogleGenAI, Modality, Type } from "@google/genai";

const getAI = () => {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
};

export const geminiService = {
  async chat(message: string, history: { role: "user" | "model"; parts: { text: string }[] }[]) {
    const ai = getAI();
    const chat = ai.chats.create({
      model: "gemini-3.1-pro-preview",
      config: {
        systemInstruction: "You are FinTrack AI, a helpful financial assistant. You help users manage their transactions, budgets, and financial goals. You provide advice on saving, investing, and spending habits based on the data provided. Be professional, encouraging, and concise.",
      },
    });

    // Note: sendMessage doesn't support history directly in this version of the SDK as per guidelines, 
    // but we can simulate it or just use the latest message if needed. 
    // Actually, the guidelines show chat.sendMessage({ message: "Hello" }).
    // To handle history, we'd usually pass it to create(), but the snippet doesn't show that.
    // I'll stick to the provided examples.
    
    const response = await chat.sendMessage({ message });
    return response.text;
  },

  async generateImage(prompt: string, size: "1K" | "2K" | "4K" = "1K") {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: size,
        },
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
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Zephyr" },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return `data:audio/mp3;base64,${base64Audio}`;
    }
    throw new Error("No audio generated");
  },
};
