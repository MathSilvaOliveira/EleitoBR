-- CreateTable
CREATE TABLE "Municipio" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "uf" TEXT NOT NULL DEFAULT 'SP',

    CONSTRAINT "Municipio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FaixaEtaria" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,

    CONSTRAINT "FaixaEtaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Escolaridade" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,

    CONSTRAINT "Escolaridade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EleitoradoPerfil" (
    "id" SERIAL NOT NULL,
    "municipioId" INTEGER NOT NULL,
    "faixaEtariaId" INTEGER NOT NULL,
    "escolaridadeId" INTEGER NOT NULL,
    "genero" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,

    CONSTRAINT "EleitoradoPerfil_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Municipio_codigo_key" ON "Municipio"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "FaixaEtaria_codigo_key" ON "FaixaEtaria"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Escolaridade_codigo_key" ON "Escolaridade"("codigo");

-- CreateIndex
CREATE INDEX "EleitoradoPerfil_municipioId_idx" ON "EleitoradoPerfil"("municipioId");

-- CreateIndex
CREATE INDEX "EleitoradoPerfil_faixaEtariaId_idx" ON "EleitoradoPerfil"("faixaEtariaId");

-- CreateIndex
CREATE INDEX "EleitoradoPerfil_escolaridadeId_idx" ON "EleitoradoPerfil"("escolaridadeId");

-- CreateIndex
CREATE INDEX "EleitoradoPerfil_genero_idx" ON "EleitoradoPerfil"("genero");

-- AddForeignKey
ALTER TABLE "EleitoradoPerfil" ADD CONSTRAINT "EleitoradoPerfil_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "Municipio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EleitoradoPerfil" ADD CONSTRAINT "EleitoradoPerfil_faixaEtariaId_fkey" FOREIGN KEY ("faixaEtariaId") REFERENCES "FaixaEtaria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EleitoradoPerfil" ADD CONSTRAINT "EleitoradoPerfil_escolaridadeId_fkey" FOREIGN KEY ("escolaridadeId") REFERENCES "Escolaridade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
