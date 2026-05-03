import { NextRequest, NextResponse } from 'next/server';
import { getAI } from '@/lib/ai';
import { Type } from '@google/genai';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000; // 2 seconds

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(error: any): boolean {
  return (
    error?.status === 429 ||
    error?.code === 429 ||
    error?.httpStatusCode === 429 ||
    error?.message?.includes('429') ||
    error?.message?.toLowerCase()?.includes('resource exhausted') ||
    error?.message?.toLowerCase()?.includes('rate limit') ||
    error?.message?.toLowerCase()?.includes('quota')
  );
}

export async function POST(req: NextRequest) {
  try {
    const { profile } = await req.json();

    if (!profile) {
      return NextResponse.json({ error: 'Profile data is required' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 });
    }

    const { gender, age, weight, height, objective, frequency } = profile;

    const prompt = `Gere uma rotina de treinos completa para uma semana com base neste perfil:
      - Gênero: ${gender} - Idade: ${age} anos - Peso: ${weight}kg - Altura: ${height}cm - Objetivo: ${objective} - Frequência: ${frequency} dias por semana
      Instruções: 1. Distribua os treinos de forma inteligente pelos ${frequency} dias. 2. Foque no objetivo informativo. 3. Para cada treino, sugira 5 a 7 exercícios.
      4. Retorne APENAS um JSON no formato: { "plan": [{ "name": string, "category": string, "daysOfWeek": number[], "exercises": [{ "name": string, "sets": number, "reps": number, "weight": number, "restTime": number }] }] }`;

    const ai = getAI();

    const generateContentConfig = {
      model: "gemini-2.0-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json" as const,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            plan: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  category: { type: Type.STRING },
                  daysOfWeek: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                  exercises: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        sets: { type: Type.NUMBER },
                        reps: { type: Type.NUMBER },
                        weight: { type: Type.NUMBER },
                        restTime: { type: Type.NUMBER },
                      },
                      required: ["name", "sets", "reps", "weight", "restTime"] as const,
                    },
                  },
                },
                required: ["name", "category", "daysOfWeek", "exercises"] as const,
              },
            },
          },
          required: ["plan"] as const,
        },
      },
    };

    // Retry loop with exponential backoff for rate limit errors
    let lastError: any = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1); // 2s, 4s, 8s
          console.log(`[Gemini] Retry attempt ${attempt}/${MAX_RETRIES} after ${delay}ms...`);
          await sleep(delay);
        }

        const response = await ai.models.generateContent(generateContentConfig);
        const result = JSON.parse(response.text!);
        return NextResponse.json(result);
      } catch (error: any) {
        lastError = error;
        if (isRateLimitError(error) && attempt < MAX_RETRIES) {
          console.warn(`[Gemini] Rate limited (attempt ${attempt + 1}/${MAX_RETRIES + 1}), retrying...`);
          continue;
        }
        // If it's not a rate limit error, or we've exhausted retries, break out
        break;
      }
    }

    // All retries exhausted or non-retryable error
    console.error('AI generation error:', lastError);

    if (isRateLimitError(lastError)) {
      return NextResponse.json(
        { error: 'A API do Gemini está temporariamente sobrecarregada. Tente novamente em 1 minuto.', retryable: true },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Falha ao gerar plano de treino. Verifique sua chave Gemini.' },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('Request processing error:', error);
    return NextResponse.json(
      { error: 'Erro interno no servidor.' },
      { status: 500 }
    );
  }
}
