import { pgTable, serial, text, integer, timestamp, varchar, boolean, real } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  cpf: varchar("cpf", { length: 14 }).unique(),
  dataNascimento: varchar("data_nascimento", { length: 10 }),
  telefone: varchar("telefone", { length: 20 }),
  email: text("email").unique(),
  password: text("password"),
  siape: varchar("siape", { length: 20 }), // Added SIAPE for IFAM
  cargo: text("cargo"),
  
  created_at: timestamp("created_at").defaultNow(),
});

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  protocolo: varchar("protocolo", { length: 20 }).notNull().unique(),
  status: text("status").default("Em Análise").notNull(),
  targetLevel: varchar("target_level", { length: 5 }), // Nível pleiteado: I, II, III, IV, V, VI

  // Pontuação e Validação
  pontuacaoTotal: real("pontuacao_total").default(0),
  pontuacaoValidada: real("pontuacao_validada").default(0), // Preenchido pelo avaliador
  
  // Avaliação
  memorial: text("memorial"),
  observacao: text("observacao"),
  avaliadoPor: text("avaliado_por"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const protocol_items = pgTable("protocol_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  applicationId: integer("application_id").references(() => applications.id),
  reqId: varchar("req_id", { length: 5 }).notNull(), // 'I', 'II', etc.
  itemId: varchar("item_id", { length: 10 }).notNull(), // 'I-1', 'II-2'
  descricao: text("descricao").notNull(),
  pontosTotais: real("pontos_totais").notNull(), // pontos base * quantidade
  quantidade: integer("quantidade").default(1),
  unidade: text("unidade"),
  userComment: text("user_comment"), // O relato de experiência do servidor
  adminComment: text("admin_comment"), // Justificativa da comissão se recusar
  statusAvaliacao: text("status_avaliacao").default("Pendente"), // Pendente, Aceito, Recusado
  
  // --- Comprovantes ---
  comprovanteUrls: text("comprovante_urls").array(),
});

export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: text("password").notNull(),
  role: text("role").default("editor").notNull(), // "Avaliador", "Admin Master"
  isActive: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 50 }).notNull().unique(),
  value: text("value").notNull(),
});
