import { NextRequest, NextResponse } from 'next/server';
import { getAI } from '@/lib/ai';
import { Type } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const { exerciseName } = await req.json();

    if (!exerciseName) {
      return NextResponse.json({ error: 'exerciseName is required' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 });
    }

    const prompt = `Sugira 3 exercícios alternativos para: "${exerciseName}". Objetivo: Substituir o exercício por outro que trabalhe o mesmo grupo muscular. Para cada alternativa, retorne: name, sets, reps, weight, restTime, videoUrl. Retorne APENAS o JSON: { "alternatives": [...] }`;

    const ai = getAI();

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json" as const,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            alternatives: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  sets: { type: Type.NUMBER },
                  reps: { type: Type.NUMBER },
                  weight: { type: Type.NUMBER },
                  restTime: { type: Type.NUMBER },
                  videoUrl: { type: Type.STRING },
                },
              },
            },
          },
        },
      },
    });

    const result = JSON.parse(response.text!);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('AI alternatives error:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar alternativas.' },
      { status: 500 }
    );
  }
}
