import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import prisma from '@/lib/db'

function generateAssetTag(typeCode: string, index: number): string {
  return `TYS-${typeCode}-${String(index + 1).padStart(5, '0')}`
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    // Get invoice with line items
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { lineItems: { include: { assetName: { include: { assetType: true } } } } },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (invoice.lineItems.length === 0) {
      return NextResponse.json({ error: 'No line items in invoice' }, { status: 400 })
    }

    const { serials } = await request.json() // array of serial numbers for each item
    const createdAssets = []

    // Generate assets for each line item
    for (const lineItem of invoice.lineItems) {
      if (!lineItem.assetName) {
        throw new Error(`Asset name not found for line item ${lineItem.id}`)
      }

      const assetType = lineItem.assetName.assetType
      const typeCode = assetType.code

      for (let i = 0; i < lineItem.quantity; i++) {
        const serial = Array.isArray(serials) && serials.length > i ? serials[i] : `SERIAL-${Date.now()}-${i}`

        const asset = await prisma.asset.create({
          data: {
            assetTag: generateAssetTag(typeCode, i),
            assetNameId: lineItem.assetNameId,
            typeId: assetType.id,
            serialNum: serial,
            status: 'Available',
            locationId: lineItem.locationId,
            purchaseCost: lineItem.unitPrice,
            warrantyStart: new Date(),
            warrantyEnd: lineItem.warrantyMonths
              ? new Date(Date.now() + lineItem.warrantyMonths * 30 * 24 * 60 * 60 * 1000)
              : null,
            invoiceLineId: lineItem.id,
            condition: 'Good',
          },
          include: { type: true },
        })

        // Record stock-in movement
        await prisma.assetMovement.create({
          data: {
            assetId: asset.id,
            action: 'StockIn',
            fromStatus: null,
            toStatus: 'Available',
            performedBy: user.id,
            notes: `Received from invoice ${invoice.invoiceNum}`,
          },
        })

        createdAssets.push({
          id: asset.id,
          assetTag: asset.assetTag,
          serialNum: asset.serialNum,
          status: asset.status,
          type: asset.type.name,
        })
      }
    }

    return NextResponse.json(
      {
        message: `Generated ${createdAssets.length} assets from invoice`,
        assets: createdAssets,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to generate assets:', error)
    const message = error instanceof Error ? error.message : 'Failed to generate assets'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
