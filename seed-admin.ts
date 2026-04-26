import { neon } from '@neondatabase/serverless';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
dotenv.config();

const sql = neon(process.env.DATABASE_URL!);

async function run() {
  try {
    console.log('Criptografando senha e criando admin...');
    const hashedPassword = bcrypt.hashSync('ifam2024', 10);
    await sql`
      INSERT INTO admins (nome, username, password, role) 
      VALUES ('Administrador IFAM', 'admin', ${hashedPassword}, 'Admin Master')
      ON CONFLICT (username) DO UPDATE SET password = ${hashedPassword}
    `;
    console.log('✅ Admin atualizado com senha criptografada!');
    process.exit(0);
  } catch(e) {
    console.error('❌ Erro ao criar admin:', e);
    process.exit(1);
  }
}

run();
