const { Client } = require('pg');

async function createDb() {
  const client = new Client({
    connectionString: 'postgresql://postgres:User1973!!@rixie.com.mx:5432/postgres'
  });
  try {
    await client.connect();
    await client.query('CREATE DATABASE "newDemo_tres"');
    console.log('Database created');
  } catch (e) {
    if (e.code === '42P04') {
        console.log('Database already exists');
    } else {
        console.error(e);
    }
  } finally {
    await client.end();
  }
}

createDb();
