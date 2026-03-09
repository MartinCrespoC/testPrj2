const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '.env' });

async function updatePassword() {
    const client = new Client({
        connectionString: 'postgresql://postgres:User1973!!@rixie.com.mx:5432/newDemo_tres'
    });

    try {
        await client.connect();
        const hash = await bcrypt.hash('admin', 10);
        await client.query(
            `UPDATE users SET password_hash = $1 WHERE email = 'admin@taskmaster.io'`,
            [hash]
        );
        console.log('Password for admin@taskmaster.io updated to: admin');
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

updatePassword();
