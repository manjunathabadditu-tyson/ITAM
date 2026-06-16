import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('\n=== USERS ===')
  const users = await prisma.appUser.findMany({ select: { id: true, email: true, name: true } })
  console.log(users)

  console.log('\n=== ASSET REQUESTS ===')
  const requests = await prisma.assetRequest.findMany({ 
    include: { requestedByUser: { select: { id: true, email: true, name: true } } }
  })
  console.log(requests)
}

main().finally(() => prisma.$disconnect())
