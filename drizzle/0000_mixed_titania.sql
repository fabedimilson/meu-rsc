CREATE TABLE "admins" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"username" varchar(50) NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'editor' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "admins_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"protocolo" varchar(20) NOT NULL,
	"status" text DEFAULT 'Em Análise' NOT NULL,
	"pontuacao_total" real DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "applications_protocolo_unique" UNIQUE("protocolo")
);
--> statement-breakpoint
CREATE TABLE "pets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"especie" text NOT NULL,
	"nome" text NOT NULL,
	"sexo" text NOT NULL,
	"is_castrado" boolean DEFAULT false,
	"is_vacinado" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"cpf" varchar(14) NOT NULL,
	"data_nascimento" varchar(10) NOT NULL,
	"is_idoso" boolean DEFAULT false,
	"telefone" varchar(20) NOT NULL,
	"email" text,
	"is_pcd" boolean DEFAULT false,
	"cep" varchar(9) NOT NULL,
	"rua" text NOT NULL,
	"bairro" text NOT NULL,
	"numero" text NOT NULL,
	"complemento" text,
	"faixa_renda" text NOT NULL,
	"nis" varchar(20),
	"pontuacao_total" real DEFAULT 0,
	"pontuacao_renda" real DEFAULT 0,
	"pontuacao_pets" real DEFAULT 0,
	"pontuacao_castracao" real DEFAULT 0,
	"pontuacao_vacinacao" real DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_cpf_unique" UNIQUE("cpf")
);
--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pets" ADD CONSTRAINT "pets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;