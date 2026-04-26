# Ração do Meu Pet - Prefeitura de Manaus

Programa oficial da Secretaria Municipal de Meio Ambiente e Sustentabilidade (SEMMAS) da Prefeitura de Manaus para garantir nutrição e bem-estar para cães e gatos de famílias de baixa renda.

## 💻 Sobre o Projeto

Este é o portal oficial de inscrições, consulta de processos e painel administrativo do programa "Ração do Meu Pet". O sistema permite que tutores cadastrem seus animais e documentos, e os fiscais/servidores analisem e pontuem as inscrições com base nos critérios estabelecidos em edital.

## 🛠️ Tecnologias Utilizadas

O sistema foi desenvolvido utilizando as seguintes tecnologias modernas:

*   **[Next.js](https://nextjs.org/)** (App Router) - Framework React para o Frontend e Backend (Server Actions).
*   **[TypeScript](https://www.typescriptlang.org/)** - Tipagem estática para JavaScript.
*   **[Tailwind CSS](https://tailwindcss.com/)** - Estilização utility-first.
*   **[Drizzle ORM](https://orm.drizzle.team/)** - ORM moderno para comunicação com o banco de dados.
*   **PostgreSQL** - Banco de dados relacional.
*   **[Lucide Icons](https://lucide.dev/)** - Biblioteca de ícones.

## 🐳 Como Executar com Docker (Recomendado para Produção/TI)

O projeto já contém os arquivos necessários para ser executado em ambientes de container (como Docker, Kubernetes, etc.).

1. Copie o arquivo de exemplo das variáveis de ambiente:
   ```bash
   cp .env.example .env
   ```
2. Configure as variáveis no arquivo `.env`, especialmente o `DATABASE_URL`.
3. (Opcional) Se for a primeira execução, sincronize o esquema do banco de dados (fora do container ou via comando manual):
   ```bash
   npx drizzle-kit push
   ```
4. Execute o Docker Compose:
   ```bash
   docker-compose up -d --build
   ```
O servidor estará acessível em `http://localhost:3000`.

## ⚙️ Como Executar Localmente (Desenvolvimento)

Caso queira executar o ambiente de desenvolvimento usando Node.js/NPM localmente:

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Configure as variáveis de ambiente no `.env.local` com a string de conexão do seu banco PostgreSQL (`DATABASE_URL`).

3. Sincronize o banco de dados (Criação de tabelas):
   ```bash
   npm run db:push
   ```

4. Execute o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## 🔒 Variáveis de Ambiente Necessárias

O arquivo `.env.local` (ou o ambiente de produção/deploy) deve possuir, no mínimo, as seguintes chaves:

*   `DATABASE_URL`: URL de conexão do PostgreSQL (ex: `postgresql://user:password@host:port/dbname`)

## 📦 Deploy (Vercel)

Se optar por deploy na [Vercel](https://vercel.com/), não é necessário configurar o Docker. Apenas vincule o repositório GitHub à Vercel e adicione a variável `DATABASE_URL` no painel de configurações do ambiente.
