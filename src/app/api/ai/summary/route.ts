import { NextResponse, NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const { prompt } = await req.json();

    const response = await fetch('https://concordia.nadro.dev/api/consultar_gemini_flash', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'ocr_7595b10ac28b072fd7e2c0ee0cd994c9'
      },
      body: JSON.stringify({
        prompt: prompt,
        file: null
      })
    });

    const aiResult = await response.json();

    if (!aiResult.success) {
      return NextResponse.json({ error: aiResult.message || 'AI Processing failed' }, { status: 500 });
    }

    return NextResponse.json({ text: aiResult.text });
  } catch (error: any) {
    console.error('AI API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
