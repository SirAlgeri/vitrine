import bcrypt from 'bcrypt';
import { pool } from './db.js';

async function createAdminUser() {
  try {
    const password = 'admin';
    const hash = await bcrypt.hash(password, 10);
    
    await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) ON CONFLICT (username) DO UPDATE SET password_hash = $2',
      ['admin', hash]
    );
    
    console.log('✅ Usuário admin criado/atualizado com sucesso!');
    console.log('Username: admin');
    console.log('Password: admin');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro:', err);
    process.exit(1);
  }
}

createAdminUser();
