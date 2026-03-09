const { Client } = require('pg');
require('dotenv').config({ path: '.env' });

async function updateSchemaAndData() {
    const client = new Client({
        connectionString: 'postgresql://postgres:User1973!!@rixie.com.mx:5432/newDemo_tres'
    });

    try {
        await client.connect();

        // Create Projects table
        await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        color VARCHAR(50) DEFAULT 'blue',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // Modify Tasks table
        await client.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE;`);
        await client.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'TODO';`);

        // Clear and insert demo projects
        await client.query('TRUNCATE projects CASCADE');
        const projRes = await client.query(`
      INSERT INTO projects (name, color) VALUES 
      ('Development', 'blue'),
      ('Marketing', 'purple')
      RETURNING id, name;
    `);
        const devId = projRes.rows.find(p => p.name === 'Development').id;
        const mktId = projRes.rows.find(p => p.name === 'Marketing').id;

        // Get an admin user ID for dummy assignments
        const userRes = await client.query(`SELECT id FROM users LIMIT 1;`);
        const userId = userRes.rows.length > 0 ? userRes.rows[0].id : null;

        // Insert dummy tasks
        await client.query('TRUNCATE tasks CASCADE');
        await client.query(`
      INSERT INTO tasks (title, description, priority, status, project_id, assignee_id, due_date) VALUES 
      ('Setup CI/CD Pipeline', 'Configure github actions for auto deployment', 'High', 'DONE', $1, $3, NOW() - INTERVAL '1 DAY'),
      ('Implement auth middleware', 'Validate JWT tokens', 'Medium', 'IN_PROGRESS', $1, $3, NOW() + INTERVAL '2 DAYS'),
      ('Design DB Schema', 'Create tables for users and projects', 'High', 'DONE', $1, $3, NOW() - INTERVAL '3 DAYS'),
      ('Create landing page mockups', 'Figma designs for new landing page', 'Medium', 'IN_PROGRESS', $2, $3, NOW() + INTERVAL '5 DAYS'),
      ('Launch Ad Campaign', 'Google Ads for Q4', 'High', 'TODO', $2, $3, NOW() + INTERVAL '10 DAYS'),
      ('Fix Dashboard UI Bugs', 'Metrics grid and checkboxes not rendering', 'High', 'TODO', $1, $3, NOW() + INTERVAL '1 DAY')
    `, [devId, mktId, userId]);

        console.log('Schema updated and dummy data inserted successfully.');
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

updateSchemaAndData();
