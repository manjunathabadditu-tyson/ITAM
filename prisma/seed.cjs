const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  await prisma.assetMovement.deleteMany()
  await prisma.asset.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.assetType.deleteMany()
  await prisma.appUser.deleteMany()

  const adminUser = await prisma.appUser.create({
    data: {
      email: 'admin@tyson.com',
      name: 'Admin User',
      role: 'admin',
    },
  })

  const purchaserUser = await prisma.appUser.create({
    data: {
      email: 'purchaser@tyson.com',
      name: 'Purchase Admin',
      role: 'purchaser',
    },
  })

  const user1 = await prisma.appUser.create({
    data: {
      email: 'john@tyson.com',
      name: 'John Smith',
      role: 'user',
    },
  })

  const user2 = await prisma.appUser.create({
    data: {
      email: 'jane@tyson.com',
      name: 'Jane Doe',
      role: 'user',
    },
  })

  const laptop = await prisma.assetType.create({
    data: {
      name: 'Laptop',
      code: 'LAP',
    },
  })

  const monitor = await prisma.assetType.create({
    data: {
      name: 'Monitor',
      code: 'MON',
    },
  })

  const keyboard = await prisma.assetType.create({
    data: {
      name: 'Keyboard',
      code: 'KEY',
    },
  })

  const asset1 = await prisma.asset.create({
    data: {
      assetTag: 'TYS-LAP-00001',
      typeId: laptop.id,
      modelName: 'Dell Latitude 5440',
      serialNum: 'SN12345',
      status: 'Assigned',
      currentHolder: user1.id,
      purchaseCost: 1200,
      warrantyEnd: new Date('2026-12-31'),
    },
  })

  const asset2 = await prisma.asset.create({
    data: {
      assetTag: 'TYS-LAP-00002',
      typeId: laptop.id,
      modelName: 'MacBook Pro 14',
      serialNum: 'SN12346',
      status: 'Available',
      purchaseCost: 2000,
      warrantyEnd: new Date('2027-06-30'),
    },
  })

  const asset3 = await prisma.asset.create({
    data: {
      assetTag: 'TYS-MON-00001',
      typeId: monitor.id,
      modelName: 'Dell U2724D',
      serialNum: 'SN98765',
      status: 'Assigned',
      currentHolder: user2.id,
      purchaseCost: 500,
      warrantyEnd: new Date('2026-08-15'),
    },
  })

  const asset4 = await prisma.asset.create({
    data: {
      assetTag: 'TYS-KEY-00001',
      typeId: keyboard.id,
      modelName: 'Logitech MX Keys',
      serialNum: 'SN11111',
      status: 'Available',
      purchaseCost: 150,
      warrantyEnd: new Date('2025-12-31'),
    },
  })

  await prisma.assetMovement.create({
    data: {
      assetId: asset1.id,
      action: 'StockIn',
      toStatus: 'Available',
      performedBy: purchaserUser.id,
      notes: 'Initial stock-in',
    },
  })

  await prisma.assetMovement.create({
    data: {
      assetId: asset1.id,
      action: 'Allocate',
      fromStatus: 'Available',
      toStatus: 'Assigned',
      toUser: user1.id,
      performedBy: adminUser.id,
      notes: 'Allocated to John Smith',
    },
  })

  await prisma.assetMovement.create({
    data: {
      assetId: asset3.id,
      action: 'StockIn',
      toStatus: 'Available',
      performedBy: purchaserUser.id,
      notes: 'Monitor stock-in',
    },
  })

  await prisma.assetMovement.create({
    data: {
      assetId: asset3.id,
      action: 'Allocate',
      fromStatus: 'Available',
      toStatus: 'Assigned',
      toUser: user2.id,
      performedBy: adminUser.id,
      notes: 'Allocated to Jane Doe',
    },
  })

  await prisma.invoice.create({
    data: {
      invoiceNum: 'INV-2024-001',
      vendor: 'Dell Technologies',
      totalAmount: 5600,
      notes: 'Initial equipment purchase',
    },
  })

  console.log('Seed data created successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
