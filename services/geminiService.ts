import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { Business, WebsiteContent } from "../types";

// Helper to get client
const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Searches for businesses using Google Maps Grounding via Gemini 2.5 Flash.
 */
export const searchBusinesses = async (
  query: string,
  location: string
): Promise<Business[]> => {
  const ai = getClient();
  const prompt = `
    Find 10 popular and highly-rated "${query}" businesses in or near "${location}".
    I am specifically looking for "thriving" businesses (4.0+ stars, 20+ reviews) that might be missing a website or have a poor online presence.
    
    Use the Google Maps tool to find real businesses details.
    
    After finding the businesses, format the output as a strictly valid JSON array.
    Each object in the array must have:
    - name (string)
    - address (string)
    - rating (number)
    - reviewCount (number)
    - websiteUri (string, use empty string "" if not found)
    - type (string, e.g., "Italian Restaurant", "Plumber")
    - summary (string, a brief 1 sentence summary)
    - phone (string, use empty string "" if not found)
    - email (string, use empty string "" if not found)

    Strictly return ONLY the JSON array. Do not include markdown formatting.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        // responseMimeType: "application/json" is NOT supported with googleMaps
      },
    });

    // response.text is a property, not a function
    let text = response.text;
    if (!text) return [];
    
    // Clean markdown code blocks if present
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      // Find the JSON array pattern
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(text);
    } catch (parseError) {
      console.error("Failed to parse JSON from Gemini response:", text);
      return []; 
    }
  } catch (error) {
    console.error("Error searching businesses:", error);
    throw error; // Propagate error to UI
  }
};

/**
 * Generates a professional image for the business using Gemini 2.5 Flash Image.
 */
export const generateBusinessImage = async (prompt: string): Promise<string | undefined> => {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: { aspectRatio: '16:9' }
      }
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data;
        }
      }
    }
  } catch (error) {
    console.error("Error generating image:", error);
  }
  return undefined;
};

/**
 * Edits an existing image using a text prompt via Gemini 2.5 Flash Image.
 */
export const editBusinessImage = async (imageBase64: string, prompt: string): Promise<string | undefined> => {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: imageBase64,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        imageConfig: { aspectRatio: '16:9' }
      }
    });

     if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data;
        }
      }
    }
  } catch (error) {
    console.error("Error editing image:", error);
    throw error;
  }
  return undefined;
};

/**
 * Generates website content and design structure using Gemini 3 Pro with Thinking Mode.
 */
export const generateWebsiteContent = async (
  business: Business
): Promise<WebsiteContent> => {
  const ai = getClient();
  
  const textPrompt = `
    You are a world-class web designer and copywriter building a Next.js + Tailwind site.
    Architect a professional single-page website for:
    
    Name: ${business.name}
    Type: ${business.type}
    Address: ${business.address}
    Rating: ${business.rating} (${business.reviewCount} reviews)
    Known for: ${business.summary || "Quality service"}
    
    Output a JSON object for the content strategy:
    {
      "businessName": string,
      "tagline": string,
      "heroHeadline": string,
      "heroSubheadline": string,
      "aboutText": string (2-3 paragraphs),
      "services": [ { "title": string, "description": string, "icon": "wrench|star|coffee|scissors|home|car|users|zap", "callout": string (optional, e.g. "Popular", "Best Value" for 1-2 items) } ],
      "testimonials": [ { "text": string, "author": string } ],
      "contactInfo": { "address": string, "phone": string, "email": string, "hours": string },
      "colorPalette": { "primary": string, "secondary": string, "accent": string, "background": string, "text": string },
      "fontStyle": "modern|classic|playful"
    }
  `;

  const imagePrompt = `A professional, photorealistic hero image for a ${business.type} named "${business.name}". High quality, modern website header style. ${business.summary || ''}`;

  try {
    // Parallel generation
    const [textResponse, imageBase64] = await Promise.all([
      ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: textPrompt,
        config: {
          thinkingConfig: { thinkingBudget: 16384 }, 
          responseMimeType: "application/json",
        },
      }),
      generateBusinessImage(imagePrompt)
    ]);

    const text = textResponse.text;
    if (!text) throw new Error("No content generated");

    const content: WebsiteContent = JSON.parse(text);
    
    if (imageBase64) {
      content.heroImageBase64 = imageBase64;
    }

    return content;
  } catch (error) {
    console.error("Error generating website:", error);
    throw error;
  }
};

/**
 * Generates a chat response using Gemini 3 Pro (Complex/Reasoning)
 */
export const generateChatResponse = async (history: {role: 'user'|'model', text: string}[], message: string, context: string) => {
  const ai = getClient();
  const systemInstruction = `You are a helpful AI assistant for the business described below. Answer questions based on this context. Keep answers concise and professional.\n\nCONTEXT:\n${context}`;
  
  try {
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: { systemInstruction },
      history: history.map(h => ({ role: h.role, parts: [{ text: h.text }] }))
    });
    
    const result = await chat.sendMessage({ message });
    return result.text;
  } catch (error) {
    console.error("Chat error:", error);
    return "I apologize, but I'm having trouble connecting right now.";
  }
};

/**
 * Generates a FAST response using Gemini 2.5 Flash Lite
 */
export const generateFastResponse = async (message: string, context: string) => {
  const ai = getClient();
  const prompt = `Context: ${context}\n\nUser Question: ${message}\n\nProvide a very short, instant answer (under 20 words) as the business assistant.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Fast chat error:", error);
    return "One moment please...";
  }
};

/**
 * Generates Speech (TTS) using Gemini 2.5 Flash TTS
 */
export const generateSpeech = async (text: string) => {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio;
  } catch (error) {
    console.error("TTS error:", error);
    throw error;
  }
};

/**
 * Generates a Video using Veo
 */
export const generateVeoVideo = async (prompt: string, imageBase64: string, aspectRatio: '16:9' | '9:16' = '16:9') => {
  const ai = getClient();
  
  try {
    // 1. Start Operation
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      image: {
        imageBytes: imageBase64,
        mimeType: 'image/png',
      },
      config: {
        numberOfVideos: 1,
        aspectRatio: aspectRatio,
      }
    });

    // 2. Poll for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
      operation = await ai.operations.getVideosOperation({ operation: operation });
      console.log("Veo status:", operation.metadata?.state);
    }

    // 3. Get URI
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("No video URI returned");

    // 4. Fetch the actual MP4 bytes using API Key
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);

  } catch (error) {
    console.error("Veo error:", error);
    throw error;
  }
};

/**
 * Connects to Gemini Live API
 */
export const connectToLiveApi = async (
  contextText: string,
  callbacks: {
    onOpen?: () => void;
    onAudioData?: (base64Data: string) => void;
    onClose?: () => void;
    onError?: (err: any) => void;
  }
) => {
  const ai = getClient();
  
  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    callbacks: {
      onopen: () => callbacks.onOpen?.(),
      onmessage: (message: LiveServerMessage) => {
        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
          callbacks.onAudioData?.(base64Audio);
        }
      },
      onclose: () => callbacks.onClose?.(),
      onerror: (err) => callbacks.onError?.(err),
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } },
      },
      systemInstruction: `You are a helpful, friendly AI receptionist for the following business: ${contextText}. Keep responses short and conversational.`,
    },
  });
};
