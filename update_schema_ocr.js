const { Client } = require('pg');
require('dotenv').config({ path: '.env' });

async function updateSchemaOcr() {
  const client = new Client({
    connectionString: 'postgresql://postgres:User1973!!@rixie.com.mx:5432/newDemo_tres'
  });
  
  try {
    await client.connect();
    
    // Create Recetas table
    await client.query(`
      CREATE TABLE IF NOT EXISTS recetas (
        id SERIAL PRIMARY KEY,
        file_name VARCHAR(255),
        medico_e_institucion TEXT,
        paciente_y_fecha TEXT,
        diagnostico_o_sintomas TEXT,
        tratamiento_indicado TEXT,
        texto_adicional TEXT,
        calidad_lectura VARCHAR(50),
        porcentaje_lectura INTEGER,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Schema updated for OCR Recetas successfully.');
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

updateSchemaOcr();
