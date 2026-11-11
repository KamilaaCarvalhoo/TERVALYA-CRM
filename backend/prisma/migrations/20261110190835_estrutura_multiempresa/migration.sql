
-- =====================================================
-- TERVALYA CRM
-- MIGRACAO: ESTRUTURA MULTIEMPRESA
-- =====================================================

-- 1. ADICIONAR companyId NAS TABELAS EXISTENTES

ALTER TABLE "activities"
ADD COLUMN "companyId" TEXT;

ALTER TABLE "appointments"
ADD COLUMN "companyId" TEXT;

ALTER TABLE "clients"
ADD COLUMN "companyId" TEXT;

ALTER TABLE "deals"
ADD COLUMN "companyId" TEXT;

ALTER TABLE "leads"
ADD COLUMN "companyId" TEXT;

ALTER TABLE "tasks"
ADD COLUMN "companyId" TEXT;

ALTER TABLE "users"
ADD COLUMN "companyId" TEXT;


-- 2. CRIAR TABELA DE EMPRESAS

CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);


-- 3. CRIAR INDICE UNICO DO SLUG

CREATE UNIQUE INDEX "companies_slug_key"
ON "companies"("slug");


-- 4. CRIAR INDICES DE companyId

CREATE INDEX "activities_companyId_idx"
ON "activities"("companyId");

CREATE INDEX "appointments_companyId_startAt_idx"
ON "appointments"("companyId", "startAt");

CREATE INDEX "clients_companyId_idx"
ON "clients"("companyId");

CREATE INDEX "deals_companyId_status_idx"
ON "deals"("companyId", "status");

CREATE INDEX "leads_companyId_status_idx"
ON "leads"("companyId", "status");

CREATE INDEX "tasks_companyId_status_idx"
ON "tasks"("companyId", "status");

CREATE INDEX "users_companyId_idx"
ON "users"("companyId");


-- 5. CRIAR A EMPRESA INICIAL

INSERT INTO "companies" (
    "id",
    "name",
    "slug",
    "createdAt",
    "updatedAt"
)
VALUES (
    '00000000-0000-4000-8000-000000000001',
    'TERVALYA - Empresa Inicial',
    'tervalya-empresa-inicial',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);


-- 6. ASSOCIAR USUARIOS EXISTENTES

UPDATE "users"
SET "companyId" = '00000000-0000-4000-8000-000000000001'
WHERE "companyId" IS NULL;


-- 7. ASSOCIAR CLIENTES A EMPRESA DOS USUARIOS

UPDATE "clients" AS c
SET "companyId" = u."companyId"
FROM "users" AS u
WHERE c."userId" = u."id"
AND c."companyId" IS NULL;


-- 8. ASSOCIAR LEADS A EMPRESA DOS USUARIOS

UPDATE "leads" AS l
SET "companyId" = u."companyId"
FROM "users" AS u
WHERE l."userId" = u."id"
AND l."companyId" IS NULL;


-- 9. ASSOCIAR NEGOCIACOES A EMPRESA DOS USUARIOS

UPDATE "deals" AS d
SET "companyId" = u."companyId"
FROM "users" AS u
WHERE d."userId" = u."id"
AND d."companyId" IS NULL;


-- 10. ASSOCIAR TAREFAS A EMPRESA DOS USUARIOS

UPDATE "tasks" AS t
SET "companyId" = u."companyId"
FROM "users" AS u
WHERE t."userId" = u."id"
AND t."companyId" IS NULL;


-- 11. ASSOCIAR ATIVIDADES A EMPRESA DOS USUARIOS

UPDATE "activities" AS a
SET "companyId" = u."companyId"
FROM "users" AS u
WHERE a."userId" = u."id"
AND a."companyId" IS NULL;


-- 12. ASSOCIAR COMPROMISSOS A EMPRESA DOS USUARIOS

UPDATE "appointments" AS a
SET "companyId" = u."companyId"
FROM "users" AS u
WHERE a."userId" = u."id"
AND a."companyId" IS NULL;


-- 13. CRIAR CHAVES ESTRANGEIRAS

ALTER TABLE "users"
ADD CONSTRAINT "users_companyId_fkey"
FOREIGN KEY ("companyId")
REFERENCES "companies"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "clients"
ADD CONSTRAINT "clients_companyId_fkey"
FOREIGN KEY ("companyId")
REFERENCES "companies"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "leads"
ADD CONSTRAINT "leads_companyId_fkey"
FOREIGN KEY ("companyId")
REFERENCES "companies"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "deals"
ADD CONSTRAINT "deals_companyId_fkey"
FOREIGN KEY ("companyId")
REFERENCES "companies"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "tasks"
ADD CONSTRAINT "tasks_companyId_fkey"
FOREIGN KEY ("companyId")
REFERENCES "companies"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "activities"
ADD CONSTRAINT "activities_companyId_fkey"
FOREIGN KEY ("companyId")
REFERENCES "companies"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "appointments"
ADD CONSTRAINT "appointments_companyId_fkey"
FOREIGN KEY ("companyId")
REFERENCES "companies"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;


-- =====================================================
-- FIM DA MIGRACAO MULTIEMPRESA
-- =====================================================
