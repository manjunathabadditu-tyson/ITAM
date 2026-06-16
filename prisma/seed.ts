import "dotenv/config"
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({ log: ['warn', 'error'] })

// Helper to create 20 assets efficiently
function generateAssets(typeId: string, assetTypeId: string, startNum: number, count: number, allocatedUserIds: string[]) {
  const assets = []
  for (let i = 0; i < count; i++) {
    const assetNum = startNum + i
    const isAllocated = i < Math.min(allocatedUserIds.length, Math.ceil(count * 0.4))
    assets.push({
      assetTag: `TYS-${typeId}-${String(assetNum).padStart(5, '0')}`,
      assetNameId: null,
      typeId: assetTypeId,
      serialNum: `${typeId}${String(assetNum).padStart(3, '0')}`,
      status: isAllocated ? 'Assigned' : 'Available',
      currentHolder: isAllocated ? allocatedUserIds[i % allocatedUserIds.length] : null,
      locationId: null,
      purchaseCost: typeId === 'LAP' ? 1200.0 : typeId === 'MON' ? 500.0 : 150.0,
      warrantyStart: new Date('2026-06-01'),
      warrantyEnd: new Date('2027-06-01'),
      condition: 'Good',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }
  return assets
}

async function main() {
  console.log('🌱 Starting database seed...')

  // Clear existing data
  try {
    await prisma.assetRequest.deleteMany({})
    await prisma.assetMovement.deleteMany({})
    await prisma.asset.deleteMany({})
    await prisma.invoiceLine.deleteMany({})
    await prisma.invoice.deleteMany({})
    await prisma.userRole.deleteMany({})
    await prisma.assetName.deleteMany({})
    await prisma.location.deleteMany({})
    await prisma.vendor.deleteMany({})
    await prisma.department.deleteMany({})
    await prisma.role.deleteMany({})
    await prisma.assetType.deleteMany({})
    await prisma.appUser.deleteMany({})
    console.log('✓ Cleared existing data')
  } catch (error) {
    console.log('First run or tables already empty')
  }

  // Create Roles - Only 2 roles: ADMIN and USER
  const adminRole = await prisma.role.create({
    data: { name: 'Admin', code: 'ADMIN' },
  })

  const userRole = await prisma.role.create({
    data: { name: 'User', code: 'USER' },
  })

  console.log('✓ Created 2 roles')

  // Create Departments
  const itDept = await prisma.department.create({
    data: { name: 'IT', code: 'IT' },
  })

  const hrDept = await prisma.department.create({
    data: { name: 'Human Resources', code: 'HR' },
  })

  const opsDept = await prisma.department.create({
    data: { name: 'Operations', code: 'OPS' },
  })

  console.log('✓ Created 3 departments')

  // Create Users - 1 Admin + 2 Regular Users
  const adminUser = await prisma.appUser.create({
    data: {
      email: 'admin@tyson.com',
      name: 'Admin User',
      authType: 'Local',
      isActive: true,
      departmentId: itDept.id,
      userRoles: {
        create: { roleId: adminRole.id },
      },
    },
  })

  const user1 = await prisma.appUser.create({
    data: {
      email: 'john@tyson.com',
      name: 'John Smith',
      authType: 'Local',
      isActive: true,
      departmentId: opsDept.id,
      userRoles: {
        create: { roleId: userRole.id },
      },
    },
  })

  const user2 = await prisma.appUser.create({
    data: {
      email: 'jane@tyson.com',
      name: 'Jane Doe',
      authType: 'Local',
      isActive: true,
      departmentId: opsDept.id,
      userRoles: {
        create: { roleId: userRole.id },
      },
    },
  })

  console.log('✓ Created 1 admin + 2 users')

  // Create Asset Types
  const laptopType = await prisma.assetType.create({
    data: { name: 'Laptop', code: 'LAP', description: 'Portable computers for employees' },
  })

  const monitorType = await prisma.assetType.create({
    data: { name: 'Monitor', code: 'MON', description: 'Display monitors' },
  })

  const keyboardType = await prisma.assetType.create({
    data: { name: 'Keyboard', code: 'KEY', description: 'Input devices' },
  })

  console.log('✓ Created 3 asset types')

  // Create Asset Names
  const dellLatitude = await prisma.assetName.create({
    data: {
      name: 'Dell Latitude 5440',
      manufacturer: 'Dell',
      assetTypeId: laptopType.id,
      defaultWarrantyMonths: 12,
      defaultSpecs: 'i7, 16GB RAM, 512GB SSD',
    },
  })

  const macbookPro = await prisma.assetName.create({
    data: {
      name: 'MacBook Pro 14',
      manufacturer: 'Apple',
      assetTypeId: laptopType.id,
      defaultWarrantyMonths: 12,
      defaultSpecs: 'M3 Pro, 16GB RAM, 512GB SSD',
    },
  })

  const dellMonitor = await prisma.assetName.create({
    data: {
      name: 'Dell U2724D',
      manufacturer: 'Dell',
      assetTypeId: monitorType.id,
      defaultWarrantyMonths: 3,
      defaultSpecs: '4K, USB-C',
    },
  })

  console.log('✓ Created 3 asset names')

  // Create Vendors
  const vendorDell = await prisma.vendor.create({
    data: {
      name: 'Dell Technologies',
      code: 'DELL',
      contactInfo: 'procurement@dell.com | +1-512-555-1234',
      isActive: true,
    },
  })

  const vendorHP = await prisma.vendor.create({
    data: {
      name: 'HP Inc.',
      code: 'HP',
      contactInfo: 'sales@hp.com | +1-650-555-5678',
      isActive: true,
    },
  })

  const vendorLenovo = await prisma.vendor.create({
    data: {
      name: 'Lenovo',
      code: 'LENOVO',
      contactInfo: 'business@lenovo.com | +1-919-555-9012',
      isActive: true,
    },
  })

  const vendorApple = await prisma.vendor.create({
    data: {
      name: 'Apple Inc.',
      code: 'APPLE',
      contactInfo: 'business@apple.com | +1-408-555-3456',
      isActive: true,
    },
  })

  console.log('✓ Created 4 vendors')

  // Create Locations
  const locationHQ = await prisma.location.create({
    data: {
      name: 'Corporate HQ',
      code: 'HQ',
      site: 'Springfield',
      address: '123 Main St, Springfield, IL',
    },
  })

  console.log('✓ Created location')

  // Create assets - 20 total (10 laptops, 7 monitors, 3 keyboards) with allocations
  const assets = []

  const allocatedUsers = [user1.id, user2.id]

  // Laptops (10)
  for (let i = 1; i <= 10; i++) {
    const asset = await prisma.asset.create({
      data: {
        assetTag: `TYS-LAP-${String(i).padStart(5, '0')}`,
        assetNameId: i % 2 === 0 ? macbookPro.id : dellLatitude.id,
        typeId: laptopType.id,
        serialNum: `LAP${String(i).padStart(3, '0')}`,
        status: i <= 4 ? 'Assigned' : 'Available',
        currentHolder: i <= 4 ? allocatedUsers[(i - 1) % allocatedUsers.length] : null,
        locationId: locationHQ.id,
        purchaseCost: i % 2 === 0 ? 1500.0 : 1200.0,
        warrantyStart: new Date('2026-06-01'),
        warrantyEnd: new Date('2027-06-01'),
        condition: 'Good',
      },
    })
    assets.push(asset)
  }

  // Monitors (7)
  for (let i = 1; i <= 7; i++) {
    const asset = await prisma.asset.create({
      data: {
        assetTag: `TYS-MON-${String(i).padStart(5, '0')}`,
        assetNameId: dellMonitor.id,
        typeId: monitorType.id,
        serialNum: `MON${String(i).padStart(3, '0')}`,
        status: i <= 2 ? 'Assigned' : 'Available',
        currentHolder: i <= 2 ? allocatedUsers[(i - 1) % allocatedUsers.length] : null,
        locationId: locationHQ.id,
        purchaseCost: 500.0,
        warrantyStart: new Date('2026-06-01'),
        warrantyEnd: new Date('2026-09-01'),
        condition: 'Good',
      },
    })
    assets.push(asset)
  }

  // Keyboards (3)
  for (let i = 1; i <= 3; i++) {
    const asset = await prisma.asset.create({
      data: {
        assetTag: `TYS-KEY-${String(i).padStart(5, '0')}`,
        assetNameId: null,
        typeId: keyboardType.id,
        modelName: i % 2 === 0 ? 'Mechanical RGB' : 'Standard Office',
        serialNum: `KEY${String(i).padStart(3, '0')}`,
        status: i === 1 ? 'Assigned' : 'Available',
        currentHolder: i === 1 ? user1.id : null,
        locationId: locationHQ.id,
        purchaseCost: 150.0,
        warrantyStart: new Date('2026-06-01'),
        warrantyEnd: new Date('2026-12-01'),
        condition: 'Good',
      },
    })
    assets.push(asset)
  }

  console.log('✓ Created 20 assets')

  // Create Asset Movements for first 6 assets (represent recent activity)
  for (let i = 0; i < Math.min(6, assets.length); i++) {
    await prisma.assetMovement.create({
      data: {
        assetId: assets[i].id,
        action: 'StockIn',
        toStatus: 'Available',
        performedBy: adminUser.id,
        notes: 'Received from vendor',
        performedAt: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000), // Spread over last 6 days
      },
    })

    if (assets[i].status === 'Assigned' && assets[i].currentHolder) {
      await prisma.assetMovement.create({
        data: {
          assetId: assets[i].id,
          action: 'Allocate',
          fromStatus: 'Available',
          toStatus: 'Assigned',
          toUserId: assets[i].currentHolder,
          performedBy: adminUser.id,
          notes: 'Allocated to user',
          performedAt: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        },
      })
    }
  }

  console.log('✓ Created asset movements')

  console.log('✨ Database seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
