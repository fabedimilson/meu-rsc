'use server';

import { db } from "@/db";
import { users, applications, protocol_items, settings } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { getAdminSession } from "./admin/actions";
import { getUserSession } from "./user-actions";
import { put } from "@vercel/blob";

async function uploadFiles(files: any[], prefix: string): Promise<string[]> {
  if (!files || !Array.isArray(files) || files.length === 0) return [];
  const urls: string[] = [];
  for (const file of files) {
    if (file && typeof file.name === 'string') {
      const ext = file.name.split('.').pop();
      const filename = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const blob = await put(filename, file, { access: 'public', addRandomSuffix: true });
      urls.push(blob.url);
    }
  }
  return urls;
}

export async function getUserApplication() {
  const session = await getUserSession();
  if (!session) return { success: false, error: "Não autorizado" };

  try {
    const [app] = await db.select().from(applications).where(eq(applications.userId, session.id)).limit(1);
    if (!app) return { success: true, data: null };

    const items = await db.select().from(protocol_items).where(eq(protocol_items.applicationId, app.id));
    
    return { success: true, data: { app, items } };
  } catch (error) {
    return { success: false, error: "Erro ao buscar protocolo." };
  }
}

export async function submitRegistration(data: any) {
  const session = await getUserSession();
  if (!session) return { success: false, error: "Não autorizado" };

  const isDraft = data.isDraft === true;
  const newStatus = isDraft ? "Rascunho" : "Em Análise";

  try {
    // 1. Check if user already has an application
    let [application] = await db.select().from(applications).where(eq(applications.userId, session.id)).limit(1);

    if (application) {
      if (application.status !== "Rascunho" && application.status !== "Pendente") {
         return { success: false, error: "Você já possui um protocolo submetido ou em avaliação." };
      }
      
      // Update existing
      [application] = await db.update(applications).set({
        status: newStatus,
        targetLevel: data.targetLevel || "I",
        pontuacaoTotal: data.pontuacaoTotal || 0,
        memorial: data.memorial || null,
        updated_at: new Date()
      }).where(eq(applications.id, application.id)).returning();

      // Clear old items
      await db.delete(protocol_items).where(eq(protocol_items.applicationId, application.id));

    } else {
      // Create new
      const protocolo = `RSC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      [application] = await db.insert(applications).values({
        userId: session.id,
        protocolo,
        status: newStatus,
        targetLevel: data.targetLevel || "I",
        pontuacaoTotal: data.pontuacaoTotal || 0,
        memorial: data.memorial || null,
      }).returning();
    }

    // 2. Insert new items
    const activities: any[] = data.activities || [];
    if (activities.length > 0) {
      for (const act of activities) {
        const comprovanteUrls: string[] = act.comprovanteUrls || [];

        await db.insert(protocol_items).values({
          userId: session.id,
          applicationId: application.id,
          reqId: act.reqId,
          itemId: act.itemId,
          descricao: act.desc,
          pontosTotais: act.points,
          quantidade: act.qty,
          unidade: act.unit,
          userComment: act.userComment,
          comprovanteUrls,
        });
      }
    }

    return { success: true, protocolo: application.protocolo, isDraft };
  } catch (error: any) {
    console.error("Erro na submissão:", error);
    return { success: false, error: "Ocorreu um erro no servidor. Verifique os dados e tente novamente." };
  }
}

export async function consultProcess(identifier: string, birthDate: string) {
  try {
    const cleanId = identifier.trim().toUpperCase();
    const cleanDate = birthDate.trim();

    if (!cleanDate || cleanDate.length !== 10) {
      return { success: false, error: "Informe uma data de nascimento válida (DD/MM/YYYY)." };
    }

    const [d, m, y] = cleanDate.split('/');
    const birthDateISO = `${y}-${m}-${d}`;

    let appResult = await db.select().from(applications).where(eq(applications.protocolo, cleanId)).limit(1);
    let user: any = null;
    let app: any = null;

    if (appResult.length > 0) {
      app = appResult[0];
      const userResult = await db.select().from(users).where(eq(users.id, app.userId)).limit(1);
      if (userResult.length > 0) user = userResult[0];
    } else {
      let cpfToSearch = cleanId;
      const digits = cleanId.replace(/\D/g, '');
      if (digits.length === 11) {
        cpfToSearch = digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
      }

      const userResult = await db.select().from(users).where(eq(users.cpf, cpfToSearch)).limit(1);
      if (userResult.length > 0) {
        user = userResult[0];
        const userAppResult = await db.select().from(applications).where(eq(applications.userId, user.id)).limit(1);
        if (userAppResult.length > 0) app = userAppResult[0];
      }
    }

    if (!user || !app) return { success: false, error: "Nenhum processo encontrado com estes dados." };
    if (user.dataNascimento !== birthDateISO) return { success: false, error: "Data de nascimento não confere com os dados do titular." };

    return {
      success: true,
      data: {
        protocolo: app.protocolo,
        nome: user.nome,
        status: app.status,
        data: app.created_at?.toLocaleDateString('pt-BR'),
        pontuacao: app.pontuacaoTotal,
        mensagem: app.status === 'Aprovado' ? "Parecer deferido." : "Em análise técnica.",
      }
    };
  } catch (error) {
    console.error("Erro na consulta:", error);
    return { success: false, error: "Erro ao consultar processo." };
  }
}

export async function toggleResultsPublished(publish: boolean) {
  const admin = await getAdminSession();
  if (admin?.role !== 'admin' && admin?.role !== 'Admin Master') return { success: false };
  await db.insert(settings).values({ key: 'results_published', value: publish ? 'true' : 'false' })
    .onConflictDoUpdate({ target: settings.key, set: { value: publish ? 'true' : 'false' } });
  return { success: true };
}

export async function checkResultsPublished() {
  const res = await db.select().from(settings).where(eq(settings.key, 'results_published')).limit(1);
  return res.length > 0 && res[0].value === 'true';
}

export async function getRegistrationDates() {
  const settingsData = await db.select().from(settings).where(inArray(settings.key, ['registration_start', 'registration_end']));
  const start = settingsData.find((s: any) => s.key === 'registration_start')?.value || '';
  const end = settingsData.find((s: any) => s.key === 'registration_end')?.value || '';
  return { start, end };
}

export async function saveRegistrationDates(start: string, end: string) {
  try {
    const admin = await getAdminSession();
    if (admin?.role !== 'admin' && admin?.role !== 'Admin Master') return { success: false, error: "Apenas administradores Master podem alterar datas." };
    
    await db.insert(settings).values({ key: 'registration_start', value: start }).onConflictDoUpdate({ target: settings.key, set: { value: start } });
    await db.insert(settings).values({ key: 'registration_end', value: end }).onConflictDoUpdate({ target: settings.key, set: { value: end } });
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao salvar datas:", error);
    return { success: false, error: "Erro no Banco: " + (error.message || "Erro desconhecido") };
  }
}
