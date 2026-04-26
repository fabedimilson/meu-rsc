'use server';

import { db } from "@/db";
import { users, applications, admins, protocol_items } from "@/db/schema";
import { eq, desc, ilike, or, count, sql, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "semmas-secret-key-2026");

// ─── AUTH ───────────────────────────────────────────────────────────────────

export async function loginAdmin(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  const result = await db.select().from(admins).where(eq(admins.username, username)).limit(1);
  const admin = result[0];

  if (!admin || !bcrypt.compareSync(password, admin.password)) {
    return { success: false, error: "Usuário ou senha inválidos" };
  }

  if (admin.isActive === false) {
    return { success: false, error: "Este usuário está desativado. Contate o administrador master." };
  }

  const token = await new SignJWT({ id: admin.id, username: admin.username, role: admin.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(JWT_SECRET);

  (await cookies()).set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
    path: '/',
  });

  return { success: true };
}

export async function logoutAdmin() {
  (await cookies()).delete('admin_token');
  return { success: true };
}

export async function getAdminSession() {
  const token = (await cookies()).get('admin_token')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { id: number; username: string; role: string };
  } catch {
    return null;
  }
}

// ─── STATISTICS ───────────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const session = await getAdminSession();
  if (!session) throw new Error("Não autorizado");

  const [totalApps] = await db.select({ count: count() }).from(applications);
  const [emAnalise] = await db.select({ count: count() }).from(applications).where(eq(applications.status, 'Em Análise'));
  const [aprovadas] = await db.select({ count: count() }).from(applications).where(eq(applications.status, 'Aprovado'));
  const [reprovadas] = await db.select({ count: count() }).from(applications).where(eq(applications.status, 'Reprovado'));

  const pontuacaoMedia = await db.select({ avg: sql<number>`avg(pontuacao_total)` }).from(applications);

  return {
    total: totalApps.count,
    emAnalise: emAnalise.count,
    aprovadas: aprovadas.count,
    reprovadas: reprovadas.count,
    totalPets: 0, // RSC doesn't have pets
    pontuacaoMedia: Math.round((pontuacaoMedia[0]?.avg ?? 0) * 10) / 10,
  };
}

// ─── LIST APPLICATIONS ────────────────────────────────────────────────────────

export async function getApplications(opts?: {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  sortOrder?: 'asc' | 'desc';
}) {
  const session = await getAdminSession();
  if (!session) throw new Error("Não autorizado");

  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 25;
  const offset = (page - 1) * pageSize;

  let query = db.select({
    id: applications.id,
    protocolo: applications.protocolo,
    status: applications.status,
    pontuacaoTotal: applications.pontuacaoTotal,
    pontuacaoValidada: applications.pontuacaoValidada,
    observacao: applications.observacao,
    avaliadoPor: applications.avaliadoPor,
    created_at: applications.created_at,
    userNome: users.nome,
    userCpf: users.cpf,
    userSiape: users.siape,
  })
  .from(applications)
  .innerJoin(users, eq(applications.userId, users.id))
  .$dynamic();

  // Filters
  const filters = [];
  if (opts?.status && opts.status !== 'all') {
    filters.push(eq(applications.status, opts.status));
  }
  if (opts?.search) {
    const cleanSearch = opts.search.replace(/[^\w\s]/g, ""); 
    filters.push(or(
      ilike(users.nome, `%${opts.search}%`),
      ilike(applications.protocolo, `%${opts.search}%`),
      ilike(users.cpf, `%${opts.search}%`),
      ilike(sql`REPLACE(REPLACE(${users.cpf}, '.', ''), '-', '')`, `%${cleanSearch}%`)
    )!);
  }
  if (filters.length > 0) {
    query = query.where(and(...filters)) as any;
  }

  const results = await (query as any)
    .orderBy(
      opts?.sortOrder === 'asc' ? applications.created_at : desc(applications.created_at)
    )
    .limit(pageSize)
    .offset(offset);

  // Count total matching
  let countQuery = db.select({ count: count() }).from(applications).innerJoin(users, eq(applications.userId, users.id)).$dynamic();
  if (filters.length > 0) {
    countQuery = countQuery.where(and(...filters)) as any;
  }
  const [{ count: totalCount }] = await countQuery;

  return { data: results, total: Number(totalCount), page, pageSize };
}

// ─── DETAILS ────────────────────────────────────────────────────────────────

export async function getApplicationDetails(appId: number) {
  const session = await getAdminSession();
  if (!session) throw new Error("Não autorizado");

  const [app] = await db.select().from(applications).where(eq(applications.id, appId)).limit(1);
  const [user] = await db.select().from(users).where(eq(users.id, app.userId)).limit(1);
  const items = await db.select().from(protocol_items).where(eq(protocol_items.applicationId, app.id));

  return { app, user, items };
}

// ─── UPDATE ──────────────────────────────────────────────────────────────────

export async function updateApplicationStatus(appId: number, status: string) {
  const session = await getAdminSession();
  if (!session) throw new Error("Não autorizado");

  await db.update(applications)
    .set({ status, avaliadoPor: session.username, updated_at: new Date() })
    .where(eq(applications.id, appId));

  return { success: true };
}

export async function updateApplicationDetails(appId: number, data: {
  status?: string;
  pontuacaoValidada?: number | null;
  observacao?: string;
}) {
  const session = await getAdminSession();
  if (!session) throw new Error("Não autorizado");

  await db.update(applications)
    .set({
      ...data,
      avaliadoPor: session.username,
      updated_at: new Date(),
    })
    .where(eq(applications.id, appId));

  return { success: true };
}

export async function updateItemStatus(itemId: number, data: {
  statusAvaliacao: string;
  adminComment?: string;
}) {
  const session = await getAdminSession();
  if (!session) throw new Error("Não autorizado");

  await db.update(protocol_items)
    .set(data)
    .where(eq(protocol_items.id, itemId));

  return { success: true };
}

// ─── EXPORT CSV ───────────────────────────────────────────────────────────────

export async function getExportData() {
  const session = await getAdminSession();
  if (!session) throw new Error("Não autorizado");

  const results = await db.select({
    protocolo: applications.protocolo,
    status: applications.status,
    pontuacaoTotal: applications.pontuacaoTotal,
    pontuacaoValidada: applications.pontuacaoValidada,
    observacao: applications.observacao,
    avaliadoPor: applications.avaliadoPor,
    created_at: applications.created_at,
    nome: users.nome,
    cpf: users.cpf,
    telefone: users.telefone,
    email: users.email,
    siape: users.siape,
    cargo: users.cargo,
  })
  .from(applications)
  .innerJoin(users, eq(applications.userId, users.id))
  .orderBy(desc(applications.pontuacaoTotal));

  return results.map(r => ({
    ...r,
    qtdItems: 0, // Could count protocol_items if needed
  }));
}

// ─── ADMIN MANAGEMENT ─────────────────────────────────────────────────────────

export async function listAdmins() {
  const session = await getAdminSession();
  if (!session || !['admin', 'Admin Master'].includes(session.role)) throw new Error("Não autorizado");

  return await db.select({
    id: admins.id,
    nome: admins.nome,
    username: admins.username,
    role: admins.role,
    isActive: admins.isActive,
    created_at: admins.created_at
  }).from(admins);
}

export async function createAdmin(data: any) {
  const session = await getAdminSession();
  if (!session || !['admin', 'Admin Master'].includes(session.role)) throw new Error("Não autorizado");

  const hashedPassword = bcrypt.hashSync(data.password, 10);

  await db.insert(admins).values({
    nome: data.nome,
    username: data.username,
    password: hashedPassword,
    role: data.role
  });

  return { success: true };
}

export async function updateAdmin(id: number, data: any) {
  const session = await getAdminSession();
  if (!session || !['admin', 'Admin Master'].includes(session.role)) throw new Error("Não autorizado");

  const updateData: any = {
    nome: data.nome,
    role: data.role,
    isActive: data.isActive === 'true' || data.isActive === true,
  };

  await db.update(admins).set(updateData).where(eq(admins.id, id));
  return { success: true };
}

export async function resetAdminPassword(id: number, newPassword: string) {
  const session = await getAdminSession();
  if (!session || !['admin', 'Admin Master'].includes(session.role)) throw new Error("Não autorizado");

  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  await db.update(admins).set({ password: hashedPassword }).where(eq(admins.id, id));
  return { success: true };
}

export async function deleteAdmin(id: number) {
  throw new Error("Exclusão desativada para auditoria. Use a desativação de conta.");
}
