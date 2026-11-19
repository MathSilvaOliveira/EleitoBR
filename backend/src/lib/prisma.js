/**
 * Singleton do Prisma Client.
 *
 * O PrismaClient gerencia internamente um connection pool para PostgreSQL.
 * Instanciar múltiplos clientes esgota as conexões disponíveis do banco.
 *
 * Em ES Modules ("type":"module" no package.json), o sistema de cache de
 * módulos do Node.js garante que este arquivo seja avaliado uma única vez
 * por processo — implementando o padrão Singleton sem necessidade de classe
 * wrapper (GAMMA et al., 1994, p. 127).
 *
 * Referência: GAMMA, E. et al. Design Patterns: Elements of Reusable
 *   Object-Oriented Software. Addison-Wesley, 1994. p. 127.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default prisma
