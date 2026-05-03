import { GoogleGenAI } from "@google/genai";

// Lazy initialization to avoid crashing at module load if key is missing
let _ai: GoogleGenAI | null = null;

export function getAI(): GoogleGenAI {
  if (!_ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY is not set. Add it to your .env.local file.'
      );
    }
    _ai = new GoogleGenAI({ apiKey });
  }
  return _ai;
}
