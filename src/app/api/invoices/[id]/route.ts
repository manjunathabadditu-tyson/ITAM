import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import prisma from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        vendor: true,
        lineItems: {
          include: { assetName: true, location: true },
        },
        createdByUser: { select: { id: true, name: true, email: true } },
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    return NextResponse.json({
      invoice: {
        id: invoice.id,
        invoiceNum: invoice.invoiceNum,
        invoiceDate: invoice.invoiceDate?.toISOString().split('T')[0],
        vendor: invoice.vendor,
        poNumber: invoice.poNumber,
        totalAmount: invoice.totalAmount,
        currency: invoice.currency,
        attachmentUrl: invoice.attachmentUrl,
        notes: invoice.notes,
        createdBy: invoice.createdByUser,
        createdAt: invoice.createdAt.toISOString().split('T')[0],
        lineItems: invoice.lineItems,
      },
    })
  } catch (error) {
    console.error('Failed to fetch invoice:', error)
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 })
  }
}
