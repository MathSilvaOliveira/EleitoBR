-- AlterTable
ALTER TABLE "EleitoradoPerfil" ADD COLUMN     "zona" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Municipio" ALTER COLUMN "uf" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "EleitoradoPerfil_faixaEtariaId_genero_idx" ON "EleitoradoPerfil"("faixaEtariaId", "genero");

-- CreateIndex
CREATE INDEX "EleitoradoPerfil_escolaridadeId_faixaEtariaId_idx" ON "EleitoradoPerfil"("escolaridadeId", "faixaEtariaId");

-- CreateIndex
CREATE INDEX "EleitoradoPerfil_escolaridadeId_genero_idx" ON "EleitoradoPerfil"("escolaridadeId", "genero");

-- CreateIndex
CREATE UNIQUE INDEX "EleitoradoPerfil_municipioId_faixaEtariaId_escolaridadeId_g_key" ON "EleitoradoPerfil"("municipioId", "faixaEtariaId", "escolaridadeId", "genero", "zona");

-- CreateIndex
CREATE INDEX "Municipio_uf_idx" ON "Municipio"("uf");

