import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import prisma from '@/lib/db'

export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        vendor: { select: { id: true, name: true } },
        createdByUser: { select: { name: true } },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      invoices: invoices.map((inv: any) => ({
        id: inv.id,
        invoiceNum: inv.invoiceNum,
        vendor: inv.vendor?.name || 'Direct Entry',
        vendorId: inv.vendor?.id,
        totalAmount: inv.totalAmount,
        currency: inv.currency,
        poNumber: inv.poNumber,
        createdAt: inv.createdAt.toISOString().split('T')[0],
        createdBy: inv.createdByUser?.name,
        notes: inv.notes,
      })),
    })
  } catch (error) {
    console.error('Failed to fetch invoices:', error)
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { invoiceNum, vendorId, invoiceDate, poNumber, totalAmount, currency, notes } = await request.json()

    if (!invoiceNum || !totalAmount) {
      return NextResponse.json(
        { error: 'invoiceNum and totalAmount are required' },
        { status: 400 }
      )
    }

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNum,
        invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
        vendorId: vendorId || null,
        poNumber: poNumber || null,
        totalAmount,
        currency: currency || 'USD',
        notes,
        createdBy: user.id,
      },
    })

    return NextResponse.json(
      {
        id: invoice.id,
        invoiceNum: invoice.invoiceNum,
        totalAmount: invoice.totalAmount,
        createdAt: invoice.createdAt.toISOString().split('T')[0],
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to create invoice:', error)
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
  }
}
