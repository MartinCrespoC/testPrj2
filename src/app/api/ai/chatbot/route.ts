import { NextResponse, NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const { message, systemInstruction, context, history } = await req.json();

    const response = await fetch('https://concordia.nadro.dev/api/chatbot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'ocr_7595b10ac28b072fd7e2c0ee0cd994c9'
      },
      body: JSON.stringify({
        message,
        systemInstruction,
        context: JSON.stringify(context),
        history,
        file: null
      })
    });

    const aiResult = await response.json();

    if (!response.ok || !aiResult.success) {
      return NextResponse.json({ error: aiResult.message || 'AI Chat Processing failed' }, { status: 500 });
    }

    return NextResponse.json({ text: aiResult.message });
  } catch (error: any) {
    console.error('Chatbot API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
