import { NextResponse, NextRequest } from 'next/server';
import pool from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const { file_name, file_base64, mime_type } = await req.json();

    const ocrResponse = await fetch('https://concordia.nadro.dev/api/extract_receta_medica', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'ocr_7595b10ac28b072fd7e2c0ee0cd994c9'
      },
      body: JSON.stringify({
        file: file_base64,
        mime_type: mime_type
      })
    });

    const ocrResult = await ocrResponse.json();

    if (!ocrResult.success) {
      return NextResponse.json({ error: ocrResult.error || 'OCR Processing failed' }, { status: 500 });
    }

    const firstPage = ocrResult.paginas && ocrResult.paginas[0] ? ocrResult.paginas[0] : {};

    const result = await pool.query(
      `INSERT INTO recetas (file_name, medico_e_institucion, paciente_y_fecha, diagnostico_o_sintomas, 
        tratamiento_indicado, texto_adicional, calidad_lectura, porcentaje_lectura, metadata) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        file_name, 
        firstPage.medico_e_institucion || '',
        firstPage.paciente_y_fecha || '',
        firstPage.diagnostico_o_sintomas || '',
        firstPage.tratamiento_indicado || '',
        firstPage.texto_adicional || '',
        firstPage.calidad_lectura || 'desconocida',
        firstPage.porcentaje_lectura || 0,
        JSON.stringify(ocrResult.metadata || {})
      ]
    );

    return NextResponse.json({ receta: result.rows[0] });
  } catch (error: any) {
    console.error('OCR API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const result = await pool.query('SELECT * FROM recetas ORDER BY created_at DESC');
    return NextResponse.json({ recetas: result.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
