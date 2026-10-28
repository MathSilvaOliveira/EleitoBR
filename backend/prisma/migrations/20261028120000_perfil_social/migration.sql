-- CreateTable
CREATE TABLE "EstadoCivil" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,

    CONSTRAINT "EstadoCivil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RacaCor" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,

    CONSTRAINT "RacaCor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerfilSocial" (
    "id" SERIAL NOT NULL,
    "municipioId" INTEGER NOT NULL,
    "estadoCivilId" INTEGER NOT NULL,
    "racaCorId" INTEGER NOT NULL,
    "quilombola" TEXT NOT NULL,
    "genero" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "comBiometria" INTEGER NOT NULL,
    "comDeficiencia" INTEGER NOT NULL,
    "comNomeSocial" INTEGER NOT NULL,

    CONSTRAINT "PerfilSocial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EstadoCivil_codigo_key" ON "EstadoCivil"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "RacaCor_codigo_key" ON "RacaCor"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "PerfilSocial_municipioId_estadoCivilId_racaCorId_quilombola_key" ON "PerfilSocial"("municipioId", "estadoCivilId", "racaCorId", "quilombola", "genero");

-- AddForeignKey
ALTER TABLE "PerfilSocial" ADD CONSTRAINT "PerfilSocial_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "Municipio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerfilSocial" ADD CONSTRAINT "PerfilSocial_estadoCivilId_fkey" FOREIGN KEY ("estadoCivilId") REFERENCES "EstadoCivil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerfilSocial" ADD CONSTRAINT "PerfilSocial_racaCorId_fkey" FOREIGN KEY ("racaCorId") REFERENCES "RacaCor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

