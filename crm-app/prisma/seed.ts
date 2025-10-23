import { PrismaClient, Role } from '@prisma/client'
import { hashPassword } from '../lib/auth/password'

const prisma = new PrismaClient()

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@medlemsregistret.se'
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'admin1234'

  const passwordHash = await hashPassword(adminPassword)

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      role: Role.ADMIN,
    },
    create: {
      email: adminEmail,
      name: 'Administratör',
      passwordHash,
      role: Role.ADMIN,
    },
  })

  console.log(`Skapade/uppdaterade admin-användare: ${adminEmail}`)
}

main()
  .catch((error) => {
    console.error('Seedning misslyckades', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
