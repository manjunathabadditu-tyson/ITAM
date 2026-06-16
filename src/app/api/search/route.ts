import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const q = searchParams.get('q')?.trim() || ''

    if (q.length < 2) {
      return NextResponse.json({
        assets: [],
        users: [],
        invoices: [],
        assetTypes: [],
      })
    }

    // Return mock search results
    return NextResponse.json({
      assets: [
        {
          id: '1',
          type: 'asset',
          tag: 'LAP-00234',
          model: 'Dell Latitude 5440',
          status: 'Assigned',
          currentHolder: 'John Smith',
        },
      ],
      users: [
        {
          id: '1',
          type: 'user',
          name: 'John Smith',
          email: 'john.smith@tyson.com',
          role: 'admin',
        },
      ],
      invoices: [
        {
          id: '1',
          type: 'invoice',
          invoiceNumber: 'INV-2026-0045',
          vendor: 'Dell',
          totalAmount: 45234,
        },
      ],
      assetTypes: [
        {
          id: '1',
          type: 'assetType',
          name: 'Laptop',
          code: 'LAP',
          assetCount: 2145,
        },
      ],
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}
