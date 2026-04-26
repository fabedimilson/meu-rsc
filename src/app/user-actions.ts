'use server';
import { neon } from '@neondatabase/serverless';

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "semmas-secret-key-2026");

export async function registerUser(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string || "Servidor IFAM";
  const campus = formData.get('campus') as string || "";

  console.log('Tentativa de Registro:', email);

  if (!email || !password) {
    return { success: false, error: "Preencha todos os campos." };
  }

  if (!email.endsWith('@ifam.edu.br')) {
    return { success: false, error: "Apenas e-mails @ifam.edu.br são permitidos para cadastro." };
  }

  try {
    console.log('Verificando existência do usuário via SQL Nativo...');
    const sql = neon(process.env.DATABASE_URL!);
    const existingUsers = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
    
    if (existingUsers.length > 0) {
      return { success: false, error: "Este e-mail já está cadastrado. Tente fazer login." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    console.log('Inserindo novo usuário...');
    await sql`
      INSERT INTO users (email, password, nome, campus)
      VALUES (${email}, ${hashedPassword}, ${name}, ${campus})
    `;

    console.log('Usuário cadastrado com sucesso!');
    return { success: true };
  } catch (error: any) {
    console.error('Erro detalhado no Banco (Nativo):', error);
    return { success: false, error: `Erro técnico (Nativo): ${error.message || JSON.stringify(error)}` };
  }
}

export async function loginUser(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  console.log('Tentativa de Login Nativo:', email);

  if (!email || !password) {
    return { success: false, error: "Preencha e-mail e senha." };
  }

  try {
    const sql = neon(process.env.DATABASE_URL!);
    console.log('Consultando banco nativamente...');
    const result = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
    const user = result[0];

    if (!user) {
      return { success: false, error: "Usuário não encontrado. Cadastre-se primeiro." };
    }

    // Check password
    const isPasswordCorrect = bcrypt.compareSync(password, user.password || "");
    if (!isPasswordCorrect && user.password !== password) {
      return { success: false, error: "Senha incorreta." };
    }

    const token = await new SignJWT({ 
      id: user.id, 
      email: user.email, 
      nome: user.nome,
      cpf: user.cpf,
      siape: user.siape,
      dataNascimento: user.data_nascimento // Note: SQL results usually use snake_case
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    (await cookies()).set('user_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    return { success: true };
  } catch (error: any) {
    console.error('Erro no Login:', error);
    return { success: false, error: "Erro de conexão com o servidor." };
  }
}

export async function logoutUser() {
  (await cookies()).delete('user_token');
  return { success: true };
}

export async function getUserSession() {
  const token = (await cookies()).get('user_token')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { id: number; email: string; nome: string; cpf: string; siape: string; dataNascimento: string };
  } catch {
    return null;
  }
}

export async function updateUserProfile(data: { nome: string; cpf: string; siape: string; dataNascimento: string; campus: string }) {
  const session = await getUserSession();
  if (!session) return { success: false, error: "Não autorizado" };

  try {
    let birthDateISO = data.dataNascimento;
    if (data.dataNascimento && data.dataNascimento.includes('/')) {
      const [d, m, y] = data.dataNascimento.split('/');
      birthDateISO = `${y}-${m}-${d}`;
    }

    const cleanCpf = data.cpf.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");

    const [updatedUser] = await db.update(users).set({
      nome: data.nome,
      cpf: cleanCpf,
      siape: data.siape,
      dataNascimento: birthDateISO,
      campus: data.campus,
    }).where(eq(users.id, session.id)).returning();

    // Update session token
    const token = await new SignJWT({ 
      id: updatedUser.id, 
      email: updatedUser.email, 
      nome: updatedUser.nome,
      cpf: updatedUser.cpf,
      siape: updatedUser.siape,
      dataNascimento: updatedUser.dataNascimento,
      campus: updatedUser.campus
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    (await cookies()).set('user_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao atualizar perfil." };
  }
}
