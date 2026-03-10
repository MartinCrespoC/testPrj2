const { Client } = require('pg');
require('dotenv').config({ path: '.env' });

async function updateSchemaSettings() {
  const client = new Client({
    connectionString: 'postgresql://postgres:User1973!!@rixie.com.mx:5432/newDemo_tres'
  });
  
  try {
    await client.connect();
    
    // Create Settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert default system instruction
    const defaultInstruction = "Eres un asistente virtual experto en gestión de proyectos ágiles. Tu objetivo es ayudar al usuario a entender el estado de sus tareas, recomendar prioridades y contestar cualquier duda basándote en el contexto del tablero actual proporcionado. Eres conciso, amable y prefieres dar respuestas directas al punto.";
    
    await client.query(`
      INSERT INTO settings (key, value) 
      VALUES ('chatbot_system_instruction', $1) 
      ON CONFLICT (key) DO NOTHING;
    `, [defaultInstruction]);

    console.log('Schema updated for Settings successfully.');
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

updateSchemaSettings();
