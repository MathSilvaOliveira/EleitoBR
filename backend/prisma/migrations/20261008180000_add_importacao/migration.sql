-- CreateTable
CREATE TABLE "Importacao" (
    "id" SERIAL NOT NULL,
    "arquivo" TEXT NOT NULL,
    "bytes" BIGINT NOT NULL,
    "sha256" TEXT NOT NULL,
    "baixadoEm" TIMESTAMP(3) NOT NULL,
    "carregadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "linhasLidas" INTEGER NOT NULL,
    "registrosGravados" INTEGER NOT NULL,
    "municipios" INTEGER NOT NULL,
    "observacao" TEXT,

    CONSTRAINT "Importacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Importacao_carregadoEm_idx" ON "Importacao"("carregadoEm");

