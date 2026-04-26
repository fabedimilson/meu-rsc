'use server';

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

  console.log('Tentativa de Registro:', email);

  if (!email || !password) {
    return { success: false, error: "Preencha todos os campos." };
  }

  if (!email.endsWith('@ifam.edu.br')) {
    return { success: false, error: "Apenas e-mails @ifam.edu.br são permitidos para cadastro." };
  }

  try {
    // Check if user already exists
    const existingResult = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingResult.length > 0) {
      return { success: false, error: "Este e-mail já está cadastrado. Tente fazer login." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with default role 'servidor'
    await db.insert(users).values({
      email,
      password: hashedPassword,
      nome: name,
    });

    console.log('Usuário cadastrado com sucesso!');
    return { success: true };
  } catch (error: any) {
    console.error('Erro detalhado no Banco:', error);
    const errorMsg = error.message || JSON.stringify(error);
    return { success: false, error: `Erro técnico: ${errorMsg}` };
  }
}

export async function loginUser(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  console.log('Tentativa de Login:', email);

  if (!email || !password) {
    return { success: false, error: "Preencha e-mail e senha." };
  }

  try {
    console.log('Consultando banco para login...');
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = result[0];

    if (!user) {
      return { success: false, error: "Usuário não encontrado. Cadastre-se primeiro." };
    }

    // Check password
    const isPasswordCorrect = bcrypt.compareSync(password, user.password || "");
    // Fallback if password was stored as plain text during initial tests
    const isPlainTextCorrect = user.password === password;

    if (!isPasswordCorrect && !isPlainTextCorrect) {
      return { success: false, error: "Senha incorreta." };
    }

    const token = await new SignJWT({ 
      id: user.id, 
      email: user.email, 
      nome: user.nome,
      cpf: user.cpf,
      siape: user.siape,
      dataNascimento: user.dataNascimento
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

export async function updateUserProfile(data: { nome: string; cpf: string; siape: string; dataNascimento: string }) {
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
    }).where(eq(users.id, session.id)).returning();

    // Update session token
    const token = await new SignJWT({ 
      id: updatedUser.id, 
      email: updatedUser.email, 
      nome: updatedUser.nome,
      cpf: updatedUser.cpf,
      siape: updatedUser.siape,
      dataNascimento: updatedUser.dataNascimento
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
