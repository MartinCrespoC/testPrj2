const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function createSchema() {
    const client = new Client({
        connectionString: 'postgresql://postgres:User1973!!@rixie.com.mx:5432/newDemo_tres'
    });

    try {
        await client.connect();

        // Create Users Table
        await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'Viewer',
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // Create Tasks Table
        await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        priority VARCHAR(20) DEFAULT 'Medium',
        due_date TIMESTAMP,
        completed BOOLEAN DEFAULT false,
        assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // Insert Initial Admin
        const checkAdmin = await client.query(`SELECT id FROM users WHERE email = 'admin@taskmaster.io'`);
        if (checkAdmin.rows.length === 0) {
            const hash = await bcrypt.hash('admin123', 10);
            await client.query(
                `INSERT INTO users (name, email, password_hash, role, status) VALUES ($1, $2, $3, $4, $5)`,
                ['Alex Johnson', 'admin@taskmaster.io', hash, 'Admin', 'Active']
            );
            console.log('Inserted default admin: admin@taskmaster.io / admin123');
        }

        console.log('Schema created successfully');
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

createSchema();
