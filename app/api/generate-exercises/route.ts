import { NextRequest, NextResponse } from 'next/server';
import { getAI } from '@/lib/ai';
import { Type } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const { category, name, profile } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 });
    }

    const profileInfo = profile
      ? `Perfil do Usuário: Gênero: ${profile.gender}, Idade: ${profile.age} anos, Peso: ${profile.weight}kg, Altura: ${profile.height}cm, Objetivo: ${profile.objective}, Frequência: ${profile.frequency} dias/semana`
      : '';

    const prompt = `Gere um treino de academia detalhado e personalizado em Português. ${profileInfo} Nome do Treino Sugerido: ${name || 'Novo Treino'} Categoria: ${category} Objetivo: Sugira exercícios que façam sentido para esta categoria e perfil. Retorne um JSON com a lista de exercícios. Cada exercício deve ter: name (string), sets (number), reps (number), weight (number), restTime (number), videoUrl (string). Sugira de 5 a 8 exercícios.`;

    const ai = getAI();

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json" as const,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
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
                  videoUrl: { type: Type.STRING },
                },
                required: ["name", "sets", "reps", "weight", "restTime"] as const,
              },
            },
          },
          required: ["exercises"] as const,
        },
      },
    });

    const result = JSON.parse(response.text!);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('AI generate exercises error:', error);
    return NextResponse.json(
      { error: 'Falha ao gerar exercícios com IA.' },
      { status: 500 }
    );
  }
}
