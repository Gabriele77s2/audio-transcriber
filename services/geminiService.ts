
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // This will be caught by the app's error boundary or result in a clear console error.
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      const parts = base64data.split(',');
      if (parts.length !== 2) {
        return reject(new Error("Invalid base64 data format"));
      }
      resolve(parts[1]);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(blob);
  });
};

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  const base64Audio = await blobToBase64(audioBlob);
  
  const audioPart = {
    inlineData: {
      mimeType: audioBlob.type,
      data: base64Audio,
    },
  };

  const textPart = {
    text: "Transcribe the following audio. Provide only the transcribed text, without any additional comments, formatting, or introductions.",
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [textPart, audioPart] },
    });
    return response.text;
  } catch(e) {
      console.error(e);
      throw new Error("Failed to get a response from the Gemini API. Please check the console for more details.");
  }
};
