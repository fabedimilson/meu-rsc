'use server';

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "semmas-secret-key-2026");

export async function loginUser(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, error: "Preencha e-mail e senha." };
  }

  // Find user by email
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = result[0];

  // MOCK LOGIC for demonstration purposes:
  // Since we don't have LDAP integration yet, we'll allow login if the email ends with @ifam.edu.br
  // and we'll "auto-create" or "auto-login" if they provide any password for now to allow previewing the flow.
  
  let validUser = user;

  if (!user) {
    if (email.endsWith('@ifam.edu.br') || email.endsWith('@gmail.com')) {
      // Mock user creation for demo
      const hashedPassword = bcrypt.hashSync(password, 10);
      try {
        const [newUser] = await db.insert(users).values({
          nome: "Servidor Exemplo",
          cpf: Math.floor(Math.random() * 100000000000).toString().padStart(11, '0').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"),
          dataNascimento: "1980-01-01",
          telefone: "(92) 90000-0000",
          email: email,
          password: hashedPassword,
          siape: "1234567",
        }).returning();
        validUser = newUser;
      } catch (e: any) {
        return { success: false, error: "Erro ao simular login: " + e.message };
      }
    } else {
      return { success: false, error: "Utilize seu e-mail institucional (@ifam.edu.br)." };
    }
  } else {
    // If user exists, check password
    // If the user doesn't have a password yet (legacy), we'll let them in and set it.
    if (user.password && !email.endsWith('@ifam.edu.br') && !bcrypt.compareSync(password, user.password)) {
      return { success: false, error: "E-mail ou senha incorretos." };
    }
    // If institutional, we can optionally update the password if it changed
    if (email.endsWith('@ifam.edu.br')) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      await db.update(users).set({ password: hashedPassword }).where(eq(users.id, user.id));
    }
  }

  const token = await new SignJWT({ 
    id: validUser.id, 
    email: validUser.email, 
    nome: validUser.nome,
    cpf: validUser.cpf,
    siape: validUser.siape,
    dataNascimento: validUser.dataNascimento
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
